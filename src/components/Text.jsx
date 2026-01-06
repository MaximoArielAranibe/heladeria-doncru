import '../styles/Text.scss'


const Text = ({text}) => {
  return (
    <div className='container'>
      <p className="container__text">{text}</p>
    </div>
  )
}

export default Text