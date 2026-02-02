import React, { useEffect, useState } from 'react';
import '../App.css'

function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState({}); // e.g., {summary: '...', stats: {...}}

  useEffect(() => {
    fetch('/api/analysis')
      .then(res => res.json())
      .then(data => setAnalysisData(data))
      .catch(err => console.error('Analysis API error:', err));
  }, []);

  return (
    <div className="analysis-page">
      <h2>Trade Analysis</h2>
      <p>{analysisData.summary || 'Loading analysis...'}</p>
      {/* Add more details like charts/tables as needed */}
    </div>
  );
}

export default AnalysisPage;