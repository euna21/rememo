import React from 'react';
// @ts-ignore
// @ts-nocheck
import DiaryScreen from './screens/DiaryScreen'; 

function MyDiaryView() {
  const DiaryComponent = DiaryScreen as any;

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, backgroundColor: '#e6e6e6' }}>
      <DiaryComponent /> 
    </div>
  );
}

export default MyDiaryView;