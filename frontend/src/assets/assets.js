import basket_icon from './basket_icon.png'
import logo from './logo.png'
import header_img from './header_img.png'
import search_icon from './search_icon.png'
import location_1 from './location_1.png'
import logo_1 from './logo_1.png'

import menu_1 from './menu_1.png'
import menu_2 from './menu_2.png'
import menu_3 from './menu_3.png'
import menu_4 from './menu_4.png'
import menu_5 from './menu_5.png'
import menu_6 from './menu_6.png'
import menu_7 from './menu_7.png'
import menu_8 from './menu_8.png'

import food_1 from './food_1.png'
import food_2 from './food_2.png'
import food_3 from './food_3.png'
import food_4 from './food_4.png'




import add_icon_white from './add_icon_white.png'
import add_icon_green from './add_icon_green.png'
import remove_icon_red from './remove_icon_red.png'
import app_store from './app_store.png'
import play_store from './play_store.png'
import linkedin_icon from './linkedin_icon.png'
import facebook_icon from './facebook_icon.png'
import twitter_icon from './twitter_icon.png'
import cross_icon from './cross_icon.png'
import selector_icon from './selector_icon.png'
import rating_starts from './rating_starts.png'
import profile_icon from './profile_icon.png'
import bag_icon from './bag_icon.png'
import logout_icon from './logout_icon.png'
import parcel_icon from './parcel_icon.png'

export const assets = {
    logo,
    basket_icon,
    header_img,
    search_icon,
    rating_starts,
    add_icon_green,
    add_icon_white,
    logo_1,
    location_1,
    remove_icon_red,
    app_store,
    play_store,
    linkedin_icon,
    facebook_icon,
    twitter_icon,
    cross_icon,
    selector_icon,
    profile_icon,
    logout_icon,
    bag_icon,
    parcel_icon,
    food_1,
    food_2,
    food_3,
    food_4
}

export const menu_list = [
    {
        menu_name: "Salad",
        menu_image: menu_1
    },
    {
        menu_name: "Rolls",
        menu_image: menu_2
    },
    {
        menu_name: "Deserts",
        menu_image: menu_3
    },
    {
        menu_name: "Sandwich",
        menu_image: menu_4
    },
    {
        menu_name: "Cake",
        menu_image: menu_5
    },
    {
        menu_name: "Pure Veg",
        menu_image: menu_6
    },
    {
        menu_name: "Pasta",
        menu_image: menu_7
    },
    {
        menu_name: "Noodles",
        menu_image: menu_8
    }]

export const food_list = [
    {
        _id: "33",
        name: "Gujarati Thali",
        image: food_1,
        price: 15,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Gujarati"
    },{
        _id: "34",
        name: "Punjabi Thali",
        image: food_2,
        price: 15,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Punjabi"
    },{
        _id: "35",
        name: "Jain Thali",
        image: food_3,
        price: 15,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Jain"
    },{
        _id: "36",
        name: "Healthy/Diet Thali",
        image: food_4, 
        price: 15,
        description: "Food provides essential nutrients for overall health and well-being",
        category: "Healthy"
    }

]

export const cooks_list = [
    {
        _id: "c1",
        cook_name: "Premila Ben's Kitchen",
        cuisine: "Gujarati, Jain",
        address: "Navrangpura, Ahmedabad",
        rating: "4.8",
        isVeg: true,
        image: food_1
    },
    {
        _id: "c2",
        cook_name: "Simran Kaur's Tiffin Services",
        cuisine: "Punjabi, North Indian",
        address: "Vastrapur, Ahmedabad",
        rating: "4.7",
        isVeg: false,
        image: food_2
    },
    {
        _id: "c3",
        cook_name: "Bhakti Pure Veg Dibba",
        cuisine: "Jain, Swaminarayan",
        address: "Paldi, Ahmedabad",
        rating: "4.9",
        isVeg: true,
        image: food_3
    },
    {
        _id: "c4",
        cook_name: "NutriMeal Home Kitchen",
        cuisine: "Healthy, Diet Food",
        address: "Bodakdev, Ahmedabad",
        rating: "4.6",
        isVeg: true,
        image: food_4
    }
]

export const orders_list = [
    {
        _id: "ORD-9281",
        status: "Preparing", // Active order
        date: "Today, 1:15 PM",
        cookName: "Premila Ben's Kitchen",
        items: [
            { name: "Gujarati Thali", quantity: 2, price: 150 }
        ],
        totalAmount: 300,
        address: "102, Shivalik Heights, Navrangpura",
        estimatedTime: "20-25 mins",
        step: 2 // 1: Placed, 2: Preparing, 3: Out for Delivery, 4: Delivered
    },
    {
        _id: "ORD-8812",
        status: "Delivered",
        date: "14 Aug 2026, 7:30 PM",
        cookName: "Simran Kaur's Tiffin Services",
        items: [
            { name: "Punjabi Thali", quantity: 1, price: 150 },
            { name: "Extra Butter Roti", quantity: 2, price: 30 }
        ],
        totalAmount: 180,
        address: "102, Shivalik Heights, Navrangpura",
        step: 4
    },
    {
        _id: "ORD-7620",
        status: "Delivered",
        date: "12 Aug 2026, 1:00 PM",
        cookName: "Bhakti Pure Veg Dibba",
        items: [
            { name: "Jain Thali", quantity: 1, price: 150 }
        ],
        totalAmount: 150,
        address: "102, Shivalik Heights, Navrangpura",
        step: 4
    }
]