import React, { useState } from 'react'
import CustomerHeader from '../../components/header/customer/CustomerHeader'
import CustomerExploreMenu from '../../components/exploreMenu/customer/CustomerExploreMenu'
import CustomerFoodDisplay from '../../components/foodDisplay/customer/CustomerFoodDisplay'

const Home = () => {
  const [category, setCategory] = useState("All");

  return (
    <div>
      <CustomerHeader />
      <CustomerExploreMenu category={category} setCategory={setCategory} />
      <CustomerFoodDisplay category={category} />
    </div>
  )
}

export default Home