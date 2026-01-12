const SalesByDay = ({ data }) => {
  const days = Object.entries(data);

  return (
    <div>
      <h3>Ventas por día</h3>

      <ul>
        {days.map(([day, total]) => (
          <li key={day}>
            {day}: <strong>${total}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SalesByDay;
