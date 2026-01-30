'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Food, CartItem, UserSession } from '@/lib/types'
import { formatPrice } from '@/lib/utils/helpers'
import Navbar from '@/components/ui/Navbar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import FoodCard from '@/components/food/FoodCard'

export default function CustomerPage() {
    const router = useRouter()
    const supabase = createClient()

    const [session, setSession] = useState<UserSession | null>(null)
    const [foods, setFoods] = useState<Food[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showCart, setShowCart] = useState(false)
    const [showCheckout, setShowCheckout] = useState(false)

    // Checkout form
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerAddress, setCustomerAddress] = useState('')

    useEffect(() => {
        const stored = localStorage.getItem('quickbite_session')
        if (stored) {
            const sess = JSON.parse(stored)
            if (sess.role !== 'customer') {
                router.push('/admin')
                return
            }
            setSession(sess)
        } else {
            supabase.auth.getSession().then(({ data: { session: authSession } }) => {
                if (authSession?.user) {
                    const sess: UserSession = {
                        username: authSession.user.email || 'Google User',
                        role: 'customer',
                        email: authSession.user.email || undefined
                    }
                    localStorage.setItem('quickbite_session', JSON.stringify(sess))
                    setSession(sess)
                } else {
                    router.push('/')
                }
            })
        }

        const storedCart = localStorage.getItem('quickbite_cart')
        if (storedCart) setCart(JSON.parse(storedCart))
        fetchFoods()
    }, [router, supabase.auth])

    const fetchFoods = async () => {
        const { data } = await supabase.from('foods').select('*').order('created_at', { ascending: false })
        if (data) setFoods(data)
        setLoading(false)
    }

    const addToCart = (food: Food, qty: number = 1) => {
        const newCart = [...cart]
        const existing = newCart.find(item => item.foodId === food.id)

        if (existing) {
            if (existing.quantity + qty <= food.stock) existing.quantity += qty
        } else if (qty <= food.stock) {
            newCart.push({ foodId: food.id, quantity: qty })
        }

        setCart(newCart)
        localStorage.setItem('quickbite_cart', JSON.stringify(newCart))
    }

    const updateCartQty = (foodId: number, qty: number) => {
        let newCart = [...cart]
        if (qty <= 0) {
            newCart = newCart.filter(item => item.foodId !== foodId)
        } else {
            const item = newCart.find(item => item.foodId === foodId)
            const food = foods.find(f => f.id === foodId)
            if (item && food) item.quantity = Math.min(qty, food.stock)
        }
        setCart(newCart)
        localStorage.setItem('quickbite_cart', JSON.stringify(newCart))
    }

    const getCartTotal = () => cart.reduce((sum, item) => {
        const food = foods.find(f => f.id === item.foodId)
        return sum + (food ? food.price * item.quantity : 0)
    }, 0)

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault()

        const orderItems = cart.map(item => {
            const food = foods.find(f => f.id === item.foodId)!
            return { foodId: item.foodId, name: food.name, price: food.price, quantity: item.quantity, weight: food.quantity }
        })

        await supabase.from('orders').insert([{
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_address: customerAddress,
            customer_username: session?.username || 'guest',
            items: orderItems,
            total: getCartTotal(),
            status: 'pending'
        }])

        for (const item of cart) {
            const food = foods.find(f => f.id === item.foodId)
            if (food) await supabase.from('foods').update({ stock: food.stock - item.quantity }).eq('id', item.foodId)
        }

        setCart([])
        localStorage.removeItem('quickbite_cart')
        setShowCheckout(false)
        setShowCart(false)
        fetchFoods()
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        localStorage.removeItem('quickbite_session')
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl animate-bounce mb-4">🍔</div>
                    <p className="text-gray-400 animate-pulse">Loading delicious food...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <Navbar
                username={session?.username}
                cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
                onCartClick={() => setShowCart(true)}
                onLogout={handleLogout}
            />

            {/* Hero Section */}
            <section className="pt-24 pb-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        <span className="gradient-text">Hungry?</span> We got you covered!
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Fresh, delicious food delivered to your doorstep in minutes
                    </p>
                </div>
            </section>

            {/* Food Grid */}
            <section className="px-4 pb-20">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                        <span className="text-3xl">🍽️</span> Our Menu
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {foods.map(food => (
                            <FoodCard key={food.id} food={food} onAddToCart={addToCart} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Cart Sidebar */}
            {showCart && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md glass-strong border-l border-white/10 animate-in slide-in-from-right">
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <span>🛒</span> Your Cart
                                </h2>
                                <button onClick={() => setShowCart(false)} className="text-2xl text-gray-400 hover:text-white">×</button>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {cart.length === 0 ? (
                                    <div className="text-center py-16">
                                        <span className="text-6xl mb-4 block">🛒</span>
                                        <p className="text-gray-400">Your cart is empty</p>
                                    </div>
                                ) : (
                                    cart.map(item => {
                                        const food = foods.find(f => f.id === item.foodId)
                                        if (!food) return null
                                        return (
                                            <div key={item.foodId} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                                <img src={food.image} alt={food.name} className="w-20 h-20 object-cover rounded-lg" />
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{food.name}</h4>
                                                    <p className="text-orange-400 font-bold">{formatPrice(food.price)}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <button onClick={() => updateCartQty(item.foodId, item.quantity - 1)} className="w-8 h-8 bg-white/10 rounded-lg hover:bg-white/20 transition">−</button>
                                                        <span className="font-medium w-8 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateCartQty(item.foodId, item.quantity + 1)} className="w-8 h-8 bg-white/10 rounded-lg hover:bg-white/20 transition">+</button>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-lg">{formatPrice(food.price * item.quantity)}</p>
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            {cart.length > 0 && (
                                <div className="p-6 border-t border-white/10 bg-black/50">
                                    <div className="flex justify-between text-xl font-bold mb-4">
                                        <span>Total</span>
                                        <span className="gradient-text">{formatPrice(getCartTotal())}</span>
                                    </div>
                                    <Button className="w-full" size="lg" onClick={() => setShowCheckout(true)}>
                                        Proceed to Checkout
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
                    <div className="relative w-full max-w-md glass-strong rounded-3xl p-8 animate-in zoom-in-95 fade-in">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <span>📦</span> Checkout
                        </h2>
                        <form onSubmit={handleCheckout} className="space-y-4">
                            <Input label="Full Name" placeholder="John Doe" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                            <Input label="Phone Number" type="tel" placeholder="+91 98765 43210" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Delivery Address</label>
                                <textarea
                                    placeholder="Enter your full address..."
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 min-h-[100px] resize-none"
                                    required
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCheckout(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    Pay {formatPrice(getCartTotal())}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
