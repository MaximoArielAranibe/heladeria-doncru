import "../../styles/SalesBarChart.scss";

const SalesBarChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="bar-chart__empty">
        No hay datos para graficar
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => d.total),
    1
  );

  return (
    <div className="bar-chart">
      {data.map(({ day, total }) => {
        const height = Math.max(
          (total / maxValue) * 100,
          total > 0 ? 6 : 2
        );

        return (
          <div key={day} className="bar-chart__item">
            <div className="bar-chart__bar-wrapper">
              <div
                className={`bar-chart__bar ${
                  total > 0 ? "has-sales" : ""
                }`}
                style={{ height: `${height}%` }}
                title={`$${total}`}
              />
            </div>

            <span className="bar-chart__label">
              {day.slice(8, 10)}
            </span>

            <span className="bar-chart__value">
              ${total}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default SalesBarChart;
