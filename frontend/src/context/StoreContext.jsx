import React, { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    // 1. Define your backend URL here
    const url = "http://localhost:4000";
    
    // 2. State to hold your live database data
    const [food_list, setFoodList] = useState([]);
    const [cooks_list, setCooksList] = useState([]);
    const [token, setToken] = useState("");

    // NEW: Add userLocation state defaulting to Gandhinagar
    const [userLocation, setUserLocation] = useState("Gandhinagar");

    // Add this to store the cart items (e.g. { "item_id_1": 2, "item_id_2": 1 })
    const [cartItems, setCartItems] = useState({});

    // Function to add an item
    const addToCart = async (itemId) => {
        if (!cartItems[itemId]) {
            setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
        } else {
            setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
        }
        // If user is logged in, tell the backend database too!
        if (token) {
            await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
        }
    };

    // Function to remove an item
    const removeFromCart = async (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
        if (token) {
            await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
        }
    };
    
    // 3. Fetch Cooks from Backend
    const fetchCooks = async () => {
        try {
            const response = await axios.get(`${url}/api/cook/list`);
            if (response.data.success) {
                setCooksList(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching cooks:", error);
        }
    };

    // 4. Fetch Food (Assuming you create a route to fetch all food, or you can use static for now)
    const fetchFood = async () => {
        try {
            const response = await axios.get(`${url}/api/food/list`);
            if (response.data.success) {
                setFoodList(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching food:", error);
        }
    };

    // 5. Run these functions when the app loads
    useEffect(() => {
        async function loadData() {
            await fetchCooks();
            // await fetchFood(); // Uncomment if you have an /api/food/list backend route
            
            // Check if user is logged in
            if (localStorage.getItem("token")) {
                setToken(localStorage.getItem("token"));
            }
        }
        loadData();
    }, []);

    // 6. Share these variables with the rest of your app
    const contextValue = {
        food_list,
        cooks_list,
        url,
        token,
        setToken,
        cartItems,          // FIXED: Added missing cart state
        addToCart,          // FIXED: Added missing cart function
        removeFromCart,     // FIXED: Added missing cart function
        userLocation,       // NEW: Location state
        setUserLocation     // NEW: Location updater function
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;