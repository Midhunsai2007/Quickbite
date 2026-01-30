// Food item type
export interface Food {
    id: number
    name: string
    image: string
    price: number
    quantity: string
    stock: number
    ingredients: string
    created_at?: string
}

// Cart item type
export interface CartItem {
    foodId: number
    quantity: number
    food?: Food
}

// Order type
export interface Order {
    id: number
    customer_name: string
    customer_phone: string
    customer_address: string
    customer_username: string
    items: OrderItem[]
    total: number
    status: OrderStatus
    created_at: string
}

export interface OrderItem {
    foodId: number
    name: string
    price: number
    quantity: number
    weight: string
}

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'delivery_15'
    | 'delivery_30'
    | 'delivery_45'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Order Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'delivery_15', label: 'Delivery in 15 mins' },
    { value: 'delivery_30', label: 'Delivery in 30 mins' },
    { value: 'delivery_45', label: 'Delivery in 45 mins' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
]

// Review type
export interface Review {
    id: number
    food_id: number
    customer_name: string
    rating: number
    comment: string
    created_at: string
}

// User session
export interface UserSession {
    username: string
    role: 'admin' | 'customer'
    email?: string
}
