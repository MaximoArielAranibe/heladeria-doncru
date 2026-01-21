import brandImg from '../assets/background-doncru.jpeg';
import '../styles/BrandContainer.scss'

const BrandContainer = () => {
  return (
    <section className='brand'>
      <img src={brandImg} alt="" className="brand__img" />
    </section>
  )
}

export default BrandContainer