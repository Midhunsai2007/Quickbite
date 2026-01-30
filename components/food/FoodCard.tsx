'use client'

import { Food } from '@/lib/types'
import { formatPrice } from '@/lib/utils/helpers'
import Button from '@/components/ui/Button'

interface FoodCardProps {
    food: Food
    onAddToCart: (food: Food) => void
}

export default function FoodCard({ food, onAddToCart }: FoodCardProps) {
    const isOutOfStock = food.stock <= 0

    return (
        <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/10">
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={food.image}
                    alt={food.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />

                {/* Price Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-white font-bold shadow-lg">
                    {formatPrice(food.price)}
                </div>

                {/* Stock Badge */}
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="px-4 py-2 bg-red-500/90 text-white font-bold rounded-lg">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                        {food.name}
                    </h3>
                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                        {food.quantity}
                    </span>
                </div>

                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {food.ingredients}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className={`text-xs ${isOutOfStock ? 'text-red-400' : 'text-green-400'}`}>
                            {isOutOfStock ? 'Unavailable' : `${food.stock} left`}
                        </span>
                    </div>

                    <Button
                        size="sm"
                        disabled={isOutOfStock}
                        onClick={() => onAddToCart(food)}
                        className="group-hover:shadow-lg group-hover:shadow-orange-500/30"
                    >
                        Add to Cart
                    </Button>
                </div>
            </div>

            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-orange-500/10 via-transparent to-cyan-500/10" />
        </div>
    )
}
