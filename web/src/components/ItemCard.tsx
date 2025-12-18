import { useStoreShop } from "../stores/ShopStore";
import { useStoreSelf } from "../stores/PlayerDataStore";
import { ShopItem } from "../types/ShopItem";
import { SyntheticEvent } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipPortal } from "@radix-ui/react-tooltip";

export default function ItemCard({ item }: { item: ShopItem }) {
	const { addItemToCart, cartValue, cartWeight, CartItems, SellingMode, CurrentShop, addItemToSellCart, SellCartItems } = useStoreShop();
	const { Weight, MaxWeight, Money, Licenses, Job } = useStoreSelf();

	const canNotAfford = cartValue + item.price > Money.Cash && cartValue + item.price > Money.Bank && cartValue + item.price > Money.Society;
	const overWeight = Weight + cartWeight + (item.weight || 0) > MaxWeight;
	const currentItemQuantityInCart = CartItems.reduce((total, cartItem) => {
		return cartItem.id === item.id ? total + cartItem.quantity : total;
	}, 0);
	const inStock = item.count === undefined || item.count > currentItemQuantityInCart;
	const hasLicense = (!item.license && true) || (Licenses && Licenses[item.license]) === true;
	const hasCorrectGrade = !item.jobs || (item.jobs && item.jobs[Job.name] && item.jobs[Job.name] <= Job.grade);

	const disabled = canNotAfford || overWeight || !inStock || !hasLicense || !hasCorrectGrade;

	if (SellingMode) {
		const currentItemQuantityInSellCart = SellCartItems.reduce((total, cartItem) => {
			return cartItem.id === item.id ? total + cartItem.quantity : total;
		}, 0);
		const maxCanSell = (item.count || 0) - currentItemQuantityInSellCart;
		const canSell = maxCanSell > 0;

		return (
			<div
				className={`gpu-accelerated smooth-transition group relative flex h-full min-h-48 cursor-pointer flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-xl backdrop-blur-md transition-all duration-300 ${!canSell ? "cursor-not-allowed opacity-50 grayscale" : "hover:scale-[1.05] hover:shadow-2xl hover:shadow-orange-500/20"}`}
				onClick={() => {
					if (!canSell) return;
					addItemToSellCart(item, 1);
				}}
			>
				<div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
				<div className="relative flex flex-col gap-2 p-3">
					<div className="flex items-start justify-between gap-2">
						<div className="rounded-xl bg-gradient-to-br from-green-600/30 to-green-700/30 px-3 py-2 shadow-lg backdrop-blur-sm">
							<p className="text-base font-bold text-green-100">${item.price}</p>
							{typeof item.basePrice === "number" && item.basePrice > 0 && item.basePrice !== item.price && (
								<p className={`mt-0.5 text-xs font-semibold ${item.price > item.basePrice ? "text-red-300" : "text-green-300"}`}>
									{item.price > item.basePrice ? "📈" : "📉"} {Math.round(((item.price - item.basePrice) / item.basePrice) * 100)}%
								</p>
							)}
						</div>
						<div className="rounded-xl bg-gradient-to-br from-orange-600/40 to-orange-700/40 px-3 py-2 shadow-lg backdrop-blur-sm">
							<p className="text-base font-bold text-orange-100">{item.count}x</p>
						</div>
					</div>
					<div className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900/40 to-slate-800/40 p-4 shadow-inner">
						<img
							onError={(event: SyntheticEvent<HTMLImageElement, Event>) => {
								event.currentTarget.src = "./Box.png";
							}}
							className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
							src={item.imagePath}
							alt={item.label}
						/>
					</div>
					<div className="rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-900/60 px-3 py-2 text-center backdrop-blur-sm">
						<p className="bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-sm font-bold text-transparent">
							{item.label}
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<Tooltip>
			<TooltipPortal>
				{disabled && (
					<TooltipContent>
						{(!hasLicense && "Du brauchst eine " + item.license + " Lizenz um das Item zu kaufen.") ||
							(canNotAfford && "Du kannst dir das Item nicht leisten.") ||
							(overWeight && "Du kannst das Item nicht tragen.") ||
							(!inStock && "Dieser Artikel ist ausverkauft") ||
							(!hasCorrectGrade && "Du hast nicht den richtigen Job oder Rang, um dieses Item zu kaufen.")}
					</TooltipContent>
				)}
			</TooltipPortal>
			<TooltipTrigger asChild>
				<div
					className={`gpu-accelerated smooth-transition group relative flex h-full min-h-48 grow cursor-pointer flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-xl backdrop-blur-md transition-all duration-300 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[disabled=true]:grayscale hover:data-[disabled=false]:scale-[1.05] hover:data-[disabled=false]:shadow-2xl hover:data-[disabled=false]:shadow-orange-500/20`}
					data-disabled={disabled}
					onClick={() => {
						if (disabled) return;
						addItemToCart(item);
					}}
				>
					<div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
					<div className="relative flex flex-col gap-2 p-3">
						<div className="flex items-start justify-between gap-2">
							<div className={`rounded-xl px-3 py-2 shadow-lg backdrop-blur-sm ${item.price == 0 ? "bg-gradient-to-br from-emerald-600/30 to-emerald-700/30" : "bg-gradient-to-br from-blue-600/30 to-blue-700/30"}`}>
								<p className={`text-base font-bold ${item.price == 0 ? "text-emerald-100" : "text-blue-100"}`}>
									{item.price == 0 ? "GRATIS" : "$" + item.price}
								</p>
								{typeof item.basePrice === "number" && item.basePrice > 0 && item.basePrice !== item.price && (
									<p className={`mt-0.5 text-xs font-semibold ${item.price > item.basePrice ? "text-red-300" : "text-green-300"}`}>
										{item.price > item.basePrice ? "📈" : "📉"} {Math.round(((item.price - item.basePrice) / item.basePrice) * 100)}%
									</p>
								)}
							</div>
							{item.count !== undefined && (
								<div className="rounded-xl bg-gradient-to-br from-orange-600/40 to-orange-700/40 px-3 py-2 shadow-lg backdrop-blur-sm">
									<p className="text-base font-bold text-orange-100">{item.count}x</p>
								</div>
							)}
						</div>
						<div className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900/40 to-slate-800/40 p-4 shadow-inner">
							<img
								onError={(event: SyntheticEvent<HTMLImageElement, Event>) => {
									event.currentTarget.src = "./Box.png";
								}}
								className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
								src={item.imagePath}
								alt={item.label}
							/>
						</div>
						<div className="rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-900/60 px-3 py-2 text-center backdrop-blur-sm">
							<p className="bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-sm font-bold text-transparent">
								{item.label}
							</p>
						</div>
					</div>
				</div>
			</TooltipTrigger>
		</Tooltip>
	);
}
