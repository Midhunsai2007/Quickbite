'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Food, Order, Review, UserSession, ORDER_STATUSES } from '@/lib/types'
import { formatPrice, formatDate } from '@/lib/utils/helpers'
import Navbar from '@/components/ui/Navbar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AdminPage() {
    const router = useRouter()
    const supabase = createClient()

    const [session, setSession] = useState<UserSession | null>(null)
    const [activeTab, setActiveTab] = useState<'foods' | 'orders' | 'reviews'>('foods')
    const [foods, setFoods] = useState<Food[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)

    // Food form
    const [editingFood, setEditingFood] = useState<Food | null>(null)
    const [foodName, setFoodName] = useState('')
    const [foodImage, setFoodImage] = useState('')
    const [foodPrice, setFoodPrice] = useState('')
    const [foodQuantity, setFoodQuantity] = useState('')
    const [foodStock, setFoodStock] = useState('')
    const [foodIngredients, setFoodIngredients] = useState('')

    useEffect(() => {
        const stored = localStorage.getItem('quickbite_session')
        if (!stored) { router.push('/'); return }

        const sess = JSON.parse(stored)
        if (sess.role !== 'admin') { router.push('/customer'); return }

        setSession(sess)
        fetchData()
    }, [router])

    const fetchData = async () => {
        const [foodsRes, ordersRes, reviewsRes] = await Promise.all([
            supabase.from('foods').select('*').order('created_at', { ascending: false }),
            supabase.from('orders').select('*').order('created_at', { ascending: false }),
            supabase.from('reviews').select('*').order('created_at', { ascending: false })
        ])

        if (foodsRes.data) setFoods(foodsRes.data)
        if (ordersRes.data) setOrders(ordersRes.data)
        if (reviewsRes.data) setReviews(reviewsRes.data)
        setLoading(false)
    }

    const handleFoodSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const foodData = {
            name: foodName,
            image: foodImage || 'https://via.placeholder.com/400x300?text=Food',
            price: parseFloat(foodPrice),
            quantity: foodQuantity || '100g',
            stock: parseInt(foodStock) || 25,
            ingredients: foodIngredients
        }

        if (editingFood) {
            await supabase.from('foods').update(foodData).eq('id', editingFood.id)
        } else {
            await supabase.from('foods').insert([foodData])
        }

        resetFoodForm()
        fetchData()
    }

    const resetFoodForm = () => {
        setEditingFood(null)
        setFoodName('')
        setFoodImage('')
        setFoodPrice('')
        setFoodQuantity('')
        setFoodStock('')
        setFoodIngredients('')
    }

    const editFood = (food: Food) => {
        setEditingFood(food)
        setFoodName(food.name)
        setFoodImage(food.image)
        setFoodPrice(food.price.toString())
        setFoodQuantity(food.quantity)
        setFoodStock(food.stock.toString())
        setFoodIngredients(food.ingredients)
    }

    const deleteFood = async (id: number) => {
        if (confirm('Delete this food item?')) {
            await supabase.from('foods').delete().eq('id', id)
            fetchData()
        }
    }

    const updateOrderStatus = async (orderId: number, status: string) => {
        await supabase.from('orders').update({ status }).eq('id', orderId)
        fetchData()
    }

    const deleteReview = async (id: number) => {
        await supabase.from('reviews').delete().eq('id', id)
        fetchData()
    }

    const handleLogout = () => {
        localStorage.removeItem('quickbite_session')
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl animate-bounce mb-4">📊</div>
                    <p className="text-gray-400 animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    const tabs = [
        { id: 'foods' as const, label: 'Foods', icon: '🍔', count: foods.length },
        { id: 'orders' as const, label: 'Orders', icon: '📦', count: orders.length },
        { id: 'reviews' as const, label: 'Reviews', icon: '⭐', count: reviews.length },
    ]

    return (
        <div className="min-h-screen">
            <Navbar username={session?.username} onLogout={handleLogout} isAdmin />

            <main className="pt-20 pb-10 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
                        <p className="text-gray-400 mt-1">Manage your restaurant</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-2xl w-fit">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                                        : 'text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                                <span className="px-2 py-0.5 text-xs bg-black/30 rounded-full">{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    {/* Foods Tab */}
                    {activeTab === 'foods' && (
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Form */}
                            <div className="glass-strong rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    {editingFood ? '✏️ Edit Food' : '➕ Add Food'}
                                </h2>
                                <form onSubmit={handleFoodSubmit} className="space-y-4">
                                    <Input placeholder="Food Name" value={foodName} onChange={(e) => setFoodName(e.target.value)} required />
                                    <Input placeholder="Image URL" value={foodImage} onChange={(e) => setFoodImage(e.target.value)} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input type="number" placeholder="Price (₹)" value={foodPrice} onChange={(e) => setFoodPrice(e.target.value)} required />
                                        <Input placeholder="Quantity" value={foodQuantity} onChange={(e) => setFoodQuantity(e.target.value)} />
                                    </div>
                                    <Input type="number" placeholder="Stock" value={foodStock} onChange={(e) => setFoodStock(e.target.value)} required />
                                    <Input placeholder="Ingredients" value={foodIngredients} onChange={(e) => setFoodIngredients(e.target.value)} />
                                    <div className="flex gap-2">
                                        <Button type="submit" className="flex-1">{editingFood ? 'Update' : 'Add Food'}</Button>
                                        {editingFood && <Button type="button" variant="secondary" onClick={resetFoodForm}>Cancel</Button>}
                                    </div>
                                </form>
                            </div>

                            {/* List */}
                            <div className="lg:col-span-2 glass-strong rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-6">📋 All Foods</h2>
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {foods.map(food => (
                                        <div key={food.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition">
                                            <img src={food.image} alt={food.name} className="w-16 h-16 object-cover rounded-lg" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium truncate">{food.name}</h4>
                                                <p className="text-orange-400 font-bold">{formatPrice(food.price)} • {food.quantity}</p>
                                            </div>
                                            <span className="px-3 py-1 text-sm bg-white/10 rounded-lg">Stock: {food.stock}</span>
                                            <button onClick={() => editFood(food)} className="p-2 hover:bg-white/10 rounded-lg transition">✏️</button>
                                            <button onClick={() => deleteFood(food.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition">🗑️</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div className="glass-strong rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-6">📦 All Orders</h2>
                            <div className="space-y-4 max-h-[700px] overflow-y-auto">
                                {orders.map(order => (
                                    <div key={order.id} className="p-5 bg-white/5 rounded-xl border border-white/10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="font-bold text-lg">{order.customer_name}</p>
                                                <p className="text-gray-400 text-sm">{order.customer_phone}</p>
                                                <p className="text-gray-500 text-xs mt-1">{order.customer_address}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold gradient-text">{formatPrice(order.total)}</p>
                                                <p className="text-gray-500 text-xs">{formatDate(order.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                                            >
                                                {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                            </select>
                                            <span className="text-gray-400 text-sm">
                                                {order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div className="glass-strong rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-6">⭐ All Reviews</h2>
                            <div className="space-y-4 max-h-[700px] overflow-y-auto">
                                {reviews.map(review => (
                                    <div key={review.id} className="flex justify-between items-start p-5 bg-white/5 rounded-xl border border-white/10">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-medium">{review.customer_name}</span>
                                                <span className="text-yellow-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                            </div>
                                            <p className="text-gray-400">{review.comment}</p>
                                            <p className="text-gray-600 text-xs mt-2">{formatDate(review.created_at)}</p>
                                        </div>
                                        <button onClick={() => deleteReview(review.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition">🗑️</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
