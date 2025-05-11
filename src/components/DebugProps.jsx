import React from 'react';

const DebugProps = (props) => {
  console.log('Component props debug:', props);
  return (
    <div style={{
      padding: '10px',
      margin: '10px',
      border: '1px dashed #999',
      backgroundColor: '#f8f8f8'
    }}>
      <h4>Debug Props</h4>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
};

export default DebugProps;