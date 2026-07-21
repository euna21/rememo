package com.myapp.rememo;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DiaryPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
