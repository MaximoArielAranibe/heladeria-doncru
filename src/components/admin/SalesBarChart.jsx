import "../../styles/SalesbarChart.scss";

const SalesBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="bar-chart">
      {data.map(({ day, total }) => (
        <div key={day} className="bar-chart__item">
          <div className="bar-chart__bar-wrapper">
            <div
              className="bar-chart__bar"
              style={{
                height: `${(total / maxValue) * 100}%`,
              }}
            />
          </div>

          <span className="bar-chart__label">
            {day.slice(8, 10)}
          </span>

          <span className="bar-chart__value">
            ${total}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SalesBarChart;
