import React, { useState, useEffect, useContext } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'
import { getMenu } from '../../api/menu.js'
import { StoreContext } from '../../context/StoreContext'

const Home = () => {
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { setFoodList } = useContext(StoreContext);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = {};
    if (category && category !== 'All') params.category = category;

    getMenu(params)
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : (data?.items || data?.menu || []);
        setFoodList(list);
      })
      .catch((err) => {
        if (!active) return;
        setFoodList([]);
        setError(err.message || 'Could not load dishes.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [category, setFoodList]);

  return (
    <div>
      <Header />
      <ExploreMenu category={category} setCategory={setCategory} />
      <FoodDisplay category={category} loading={loading} error={error} />
      <AppDownload />
    </div>
  );
};

export default Home;
