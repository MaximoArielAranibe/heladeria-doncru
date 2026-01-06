import brandImg from '../assets/background-doncru.jpeg';
import '../styles/BrandContainer.scss'

const BrandContainer = () => {
  return (
    <div className='brand'>
      <img src={brandImg} alt="" className="brand__img" />
    </div>
  )
}

export default BrandContainer