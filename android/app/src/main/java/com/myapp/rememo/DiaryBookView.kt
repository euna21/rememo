package com.myapp.rememo

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.*
import android.view.MotionEvent
import android.view.View
import android.view.animation.DecelerateInterpolator
import kotlin.math.*

class DiaryBookView(
    context: Context,
    private val pageCount: Int,
    private val onPageSelected: (Int) -> Unit
) : View(context) {

    private var currentPage = 0
    private var dragX = 0f
    private var isDragging = false
    private var dragStartX = 0f
    private var animator: ValueAnimator? = null
    private var flipProgress = 0f  // 0f = 현재 페이지, 1f = 다음(또는 이전) 페이지로 완전히 넘어감
    private var flipDirection = 1  // 1 = 다음 페이지로, -1 = 이전 페이지로

    // 책 크기
    private var bookLeft = 0f
    private var bookTop = 0f
    private var bookRight = 0f
    private var bookBottom = 0f
    private var bookW = 0f
    private var bookH = 0f
    private var cornerR = 0f

    // Paint
    private val bgPaint = Paint().apply { color = Color.rgb(180, 175, 165) }

    private val coverPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val pagePaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val spinePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(20, 12, 5) }
    private val shadowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.argb(60, 0, 0, 0)
        maskFilter = BlurMaskFilter(30f, BlurMaskFilter.Blur.NORMAL)
    }
    private val edgePaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.argb(25, 180, 150, 100)
        strokeWidth = 1.5f
        style = Paint.Style.STROKE
    }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.argb(180, 60, 50, 35)
        textAlign = Paint.Align.CENTER
        typeface = Typeface.SERIF
    }
    private val coverTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.argb(220, 200, 165, 100)
        textAlign = Paint.Align.CENTER
        typeface = Typeface.SERIF
        isFakeBoldText = true
    }
    private val coverSubTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.argb(140, 190, 155, 95)
        textAlign = Paint.Align.CENTER
        typeface = Typeface.SERIF
    }

    // 3D 회전을 위한 Camera / Matrix (딱딱한 종이가 책등을 축으로 회전하는 느낌)
    // 기본 카메라 거리(-8)는 가까워서 회전 중 팝(popZ)이 크게 확대되어 보이므로,
    // 카메라를 더 멀리 두어 원근 왜곡(과도하게 커지는 느낌)을 완화한다.
    private val camera = Camera().apply { setLocation(0f, 0f, -20f) }
    private val flipMatrix = Matrix()

    // 정적인 페이지를 책 영역 밖으로 삐져나오지 않게 자르는 클립
    private val clipPath = Path()

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        bookW = w * 0.78f
        bookH = bookW * 1.38f
        bookLeft = w * 0.15f
        bookTop = (h - bookH) / 2f - h * 0.03f
        bookRight = bookLeft + bookW
        bookBottom = bookTop + bookH
        cornerR = bookW * 0.04f

        textPaint.textSize = w * 0.033f
        coverTextPaint.textSize = bookW * 0.16f
        coverSubTextPaint.textSize = bookW * 0.055f

        clipPath.reset()
        clipPath.addRoundRect(
            RectF(bookLeft, bookTop, bookRight, bookBottom),
            cornerR, cornerR, Path.Direction.CW
        )
    }

    override fun onDraw(canvas: Canvas) {
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgPaint)

        val progress = flipProgress
        val isFlipping = progress > 0f

        // 뒤로 넘기는 중엔 currentPage-1이 회전하며 자리를 비우므로,
        // 그 자리에는 회전이 끝난 뒤 실제로 남을 페이지(currentPage-2)를 미리 보여준다.
        val sideIndex = if (isFlipping && flipDirection < 0) currentPage - 2 else currentPage - 1
        drawSideBooks(canvas, sideIndex)

        drawShadow(canvas)
        drawPageStack(canvas)

        if (isFlipping) {
            if (flipDirection >= 0) {
                canvas.save()
                canvas.clipPath(clipPath)
                drawPage(canvas, currentPage + 1, 0f)
                canvas.restore()
                drawRigidFlip(canvas, -180f * progress, currentPage)
            } else {
                canvas.save()
                canvas.clipPath(clipPath)
                drawPage(canvas, currentPage, 0f)
                canvas.restore()
                drawRigidFlip(canvas, -180f * (1f - progress), currentPage - 1)
            }
        } else {
            canvas.save()
            canvas.clipPath(clipPath)
            drawPage(canvas, currentPage, 0f)
            canvas.restore()
        }

        drawBookFrame(canvas)
        drawBottomUI(canvas)
    }

    /**
     * 책등(bookLeft)을 회전축으로 하여 페이지를 실제 3D처럼 회전시켜 그린다.
     * angleDeg: 0 = 정면으로 완전히 펼쳐짐, -90 = 책등쪽에서 옆으로 선 상태(모서리만 보임), -180 = 뒷면이 반대쪽에 완전히 뒤집혀 놓임
     * 종이가 휘거나 미끄러지지 않고 딱딱한 판처럼 회전한다.
     */
    private fun drawRigidFlip(canvas: Canvas, angleDeg: Float, pageIndexToDraw: Int) {
        if (pageIndexToDraw < 0 || pageIndexToDraw >= pageCount) return

        val hingeX = bookLeft
        val centerY = (bookTop + bookBottom) / 2f
        val isBackFace = abs(angleDeg) > 90f

        canvas.save()

        // 회전 중간 지점에서 살짝 앞으로 튀어나오게 해 종이의 두께감/뻣뻣함을 표현
        // (값이 너무 크면 카메라 원근 때문에 페이지가 과도하게 확대되어 보이므로 작게 유지)
        val t = (abs(angleDeg) / 180f).coerceIn(0f, 1f)
        val popZ = (-bookW * 0.05f * sin(Math.PI * t).toFloat()).coerceIn(-24f, 0f)

        camera.save()
        camera.translate(0f, 0f, popZ)
        camera.rotateY(angleDeg)
        camera.getMatrix(flipMatrix)
        camera.restore()

        // 책등을 기준점으로 회전이 일어나도록 이동
        flipMatrix.preTranslate(-hingeX, -centerY)
        flipMatrix.postTranslate(hingeX, centerY)

        canvas.concat(flipMatrix)

        val rect = RectF(bookLeft, bookTop, bookRight, bookBottom)
        drawFlatFace(canvas, rect, pageIndexToDraw, isBackFace)

        // 회전 각도에 따른 명암 — 빛을 정면으로 받을수록 밝고, 옆으로 설수록(책등 근처) 어두워짐
        val facing = abs(cos(Math.toRadians(angleDeg.toDouble()))).toFloat()
        val shadeAlpha = ((1f - facing) * 140).toInt().coerceIn(0, 140)
        if (shadeAlpha > 0) {
            val shadePaint = Paint().apply { color = Color.argb(shadeAlpha, 0, 0, 0) }
            canvas.drawRoundRect(rect, cornerR, cornerR, shadePaint)
        }

        canvas.restore()
    }

    private fun drawFlatFace(canvas: Canvas, rect: RectF, pageIndex: Int, isBack: Boolean) {
        if (pageIndex == 0) {
            if (!isBack) {
                val gradient = LinearGradient(
                    rect.left, rect.top, rect.right, rect.bottom,
                    Color.rgb(72, 46, 22), Color.rgb(40, 24, 10), Shader.TileMode.CLAMP
                )
                coverPaint.shader = gradient
                canvas.drawRoundRect(rect, cornerR, cornerR, coverPaint)
                coverPaint.shader = null

                val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.argb(60, 200, 165, 100)
                    style = Paint.Style.STROKE
                    strokeWidth = 2f
                }
                val innerRect = RectF(rect.left + 16f, rect.top + 16f, rect.right - 16f, rect.bottom - 16f)
                canvas.drawRoundRect(innerRect, cornerR * 0.7f, cornerR * 0.7f, borderPaint)

                canvas.drawText("RE:MEMO", rect.centerX(), rect.centerY() - bookH * 0.04f, coverTextPaint)
                canvas.drawText("✦ MEMORY ARCHIVE ✦", rect.centerX(), rect.centerY() + bookH * 0.07f, coverSubTextPaint)
            } else {
                // 표지 안쪽 면 - 짙은 안감 느낌 (그라데이션으로 입체감)
                val gradient = LinearGradient(
                    rect.left, rect.top, rect.right, rect.bottom,
                    Color.rgb(45, 28, 12), Color.rgb(30, 18, 8), Shader.TileMode.CLAMP
                )
                pagePaint.shader = gradient
                canvas.drawRoundRect(rect, cornerR, cornerR, pagePaint)
                pagePaint.shader = null
            }
        } else {
            if (!isBack) {
                val gradient = LinearGradient(
                    rect.left, rect.top, rect.right, rect.top,
                    Color.rgb(250, 247, 240), Color.rgb(245, 242, 234), Shader.TileMode.CLAMP
                )
                pagePaint.shader = gradient
                canvas.drawRoundRect(rect, cornerR, cornerR, pagePaint)
                drawLines(canvas, rect)

                val datePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.argb(100, 120, 90, 55)
                    textSize = bookW * 0.045f
                    typeface = Typeface.SERIF
                    textAlign = Paint.Align.RIGHT
                }
                canvas.drawText("2024.0${pageIndex}.15", rect.right - 20f, rect.top + bookH * 0.07f, datePaint)

                val numPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.argb(80, 120, 90, 55)
                    textSize = bookW * 0.04f
                    typeface = Typeface.SERIF
                    textAlign = Paint.Align.CENTER
                }
                canvas.drawText("$pageIndex", rect.centerX(), rect.bottom - bookH * 0.03f, numPaint)
            } else {
                // 페이지 뒷면 - 앞면과 톤은 비슷하되 살짝 어둡게, 은은한 줄무늬로 종이 느낌
                val gradient = LinearGradient(
                    rect.left, rect.top, rect.right, rect.bottom,
                    Color.rgb(236, 231, 220), Color.rgb(226, 220, 206), Shader.TileMode.CLAMP
                )
                pagePaint.shader = gradient
                canvas.drawRoundRect(rect, cornerR, cornerR, pagePaint)
                pagePaint.shader = null

                val backLinePaint = Paint(linePaint).apply {
                    color = Color.argb(12, 150, 130, 100)
                }
                var ly = rect.top + bookH * 0.062f * 1.8f
                while (ly < rect.bottom - bookH * 0.062f) {
                    canvas.drawLine(rect.left + 20f, ly, rect.right - 16f, ly, backLinePaint)
                    ly += bookH * 0.062f
                }
            }
        }
    }

    private fun drawShadow(canvas: Canvas) {
        val shadowRect = RectF(
            bookLeft + bookW * 0.05f,
            bookBottom + 10f,
            bookRight - bookW * 0.05f,
            bookBottom + 40f
        )
        canvas.drawOval(shadowRect, shadowPaint)
    }

    private fun drawPageStack(canvas: Canvas) {
        val remaining = pageCount - currentPage - 1
        val stackCount = min(remaining, 6)
        for (i in stackCount downTo 1) {
            val offset = i * 3f
            edgePaint.color = Color.rgb(240 - i * 3, 235 - i * 3, 225 - i * 3)
            val rect = RectF(bookLeft + offset, bookTop + offset * 0.3f,
                bookRight + offset, bookBottom - offset * 0.3f)
            canvas.drawRoundRect(rect, cornerR, cornerR, edgePaint)
        }

        val passed = currentPage
        val passedCount = min(passed, 6)
        for (i in passedCount downTo 1) {
            val offset = i * 3f
            edgePaint.color = Color.rgb(235 - i * 3, 228 - i * 3, 215 - i * 3)
            val rect = RectF(bookLeft - offset, bookTop + offset * 0.3f,
                bookRight - offset, bookBottom - offset * 0.3f)
            canvas.drawRoundRect(rect, cornerR, cornerR, edgePaint)
        }
    }

    private fun drawPage(canvas: Canvas, pageIndex: Int, xOffset: Float) {
        if (pageIndex < 0 || pageIndex >= pageCount) return
        val rect = RectF(bookLeft + xOffset, bookTop, bookRight + xOffset, bookBottom)
        drawFlatFace(canvas, rect, pageIndex, isBack = false)

        if (pageIndex == 0) {
            val spineRect = RectF(rect.left, rect.top, rect.left + 18f, rect.bottom)
            val spineGrad = LinearGradient(
                spineRect.left, 0f, spineRect.right, 0f,
                Color.rgb(15, 8, 3), Color.rgb(50, 32, 14),
                Shader.TileMode.CLAMP
            )
            spinePaint.shader = spineGrad
            canvas.drawRect(spineRect, spinePaint)
        } else {
            val spineGrad = LinearGradient(
                rect.left, 0f, rect.left + bookW * 0.08f, 0f,
                Color.argb(40, 0, 0, 0), Color.TRANSPARENT,
                Shader.TileMode.CLAMP
            )
            val shadPaint = Paint().apply { shader = spineGrad }
            canvas.drawRect(rect.left, rect.top, rect.left + bookW * 0.08f, rect.bottom, shadPaint)

            spinePaint.shader = null
            spinePaint.color = Color.rgb(20, 12, 5)
            canvas.drawRect(rect.left, rect.top, rect.left + 14f, rect.bottom, spinePaint)
        }
    }

    private fun drawLines(canvas: Canvas, rect: RectF) {
        val spacing = bookH * 0.062f
        var y = rect.top + spacing * 1.8f
        while (y < rect.bottom - spacing) {
            canvas.drawLine(rect.left + 20f, y, rect.right - 16f, y, linePaint)
            y += spacing
        }
    }

    private fun drawBookFrame(canvas: Canvas) {
        val framePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.argb(25, 80, 55, 25)
            style = Paint.Style.STROKE
            strokeWidth = 3f
        }
        val rect = RectF(bookLeft, bookTop, bookRight, bookBottom)
        canvas.drawRoundRect(rect, cornerR, cornerR, framePaint)
    }

    private fun drawBottomUI(canvas: Canvas) {
        val pageText = "${currentPage + 1} / $pageCount"
        canvas.drawText(pageText, width / 2f, bookBottom + height * 0.06f, textPaint)

        val hintText = if (currentPage == 0) "탭하여 열기  |  좌우로 넘기기" else "좌우로 넘기기  |  탭하여 편집"
        val hintPaint = Paint(textPaint).apply {
            textSize = textPaint.textSize * 0.75f
            color = Color.argb(100, 60, 50, 35)
        }
        canvas.drawText(hintText, width / 2f, bookBottom + height * 0.1f, hintPaint)
    }

    private fun drawSideBooks(canvas: Canvas, pageIndex: Int) {
        if (pageIndex >= 0) {
            val prevRect = RectF(
                bookLeft - bookW,
                bookTop,
                bookLeft,
                bookBottom
            )

            canvas.save()
            canvas.clipRect(0f, bookTop, bookLeft, bookBottom)

            val underPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(230, 224, 212) }
            canvas.drawRoundRect(prevRect, cornerR, cornerR, underPaint)

            drawFlatFace(canvas, prevRect, pageIndex, isBack = true)

            canvas.restore()
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                animator?.cancel()
                isDragging = true
                dragStartX = event.x
                dragX = event.x
            }
            MotionEvent.ACTION_MOVE -> {
                dragX = event.x
                val dx = dragStartX - dragX
                when {
                    dx > 0 && currentPage < pageCount - 1 -> {
                        flipDirection = 1
                        flipProgress = (dx / bookW).coerceIn(0f, 1f)
                        invalidate()
                    }
                    dx < 0 && currentPage > 0 -> {
                        flipDirection = -1
                        flipProgress = (-dx / bookW).coerceIn(0f, 1f)
                        invalidate()
                    }
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                isDragging = false
                val dx = dragStartX - dragX

                when {
                    abs(dx) < 20f -> {
                        flipProgress = 0f
                        onPageSelected(currentPage)
                        invalidate()
                    }
                    dx > bookW * 0.35f && currentPage < pageCount - 1 -> {
                        flipDirection = 1
                        animateFlip(flipProgress, 1f) {
                            currentPage++
                            flipProgress = 0f
                            invalidate()
                        }
                    }
                    dx < -bookW * 0.35f && currentPage > 0 -> {
                        flipDirection = -1
                        animateFlip(flipProgress, 1f) {
                            currentPage--
                            flipProgress = 0f
                            invalidate()
                        }
                    }
                    else -> {
                        animateFlip(flipProgress, 0f)
                    }
                }
            }
        }
        return true
    }

    private fun animateFlip(from: Float, to: Float, onEnd: (() -> Unit)? = null) {
        animator?.cancel()
        animator = ValueAnimator.ofFloat(from, to).apply {
            duration = 380L
            interpolator = DecelerateInterpolator(1.6f)
            addUpdateListener {
                flipProgress = it.animatedValue as Float
                invalidate()
            }
            addListener(object : android.animation.AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: android.animation.Animator) {
                    onEnd?.invoke()
                }
            })
            start()
        }
    }
}