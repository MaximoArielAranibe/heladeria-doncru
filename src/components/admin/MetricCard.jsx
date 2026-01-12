const MetricCard = ({ label, value }) => {
  return (
    <div className="metric-card">
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value}</strong>
    </div>
  );
};

export default MetricCard;
