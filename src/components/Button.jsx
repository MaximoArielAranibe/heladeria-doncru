import '../styles/Button.scss';

const Button = ({ text, onClick, type = "button", className = "" }) => {
  return (
    <button
      type={type}
      className={`custom-button ${className}`}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default Button;