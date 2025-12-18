import {
	faBasketShopping,
	faCreditCard,
	faFaceFrown,
	faMoneyBill1Wave,
	faWeightHanging,
	faXmark,
	faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useStoreShop } from "../stores/ShopStore";
import { formatMoney } from "../utils/misc";
import { useStoreSelf } from "../stores/PlayerDataStore";
import { useState } from "react";
import { fetchNui } from "../utils/fetchNui";
import { Button } from "./ui/button";
import NumberInput from "./ui/number-input";
import Loader from "./Loader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formatWeight = (weight: number) => {
	weight *= 0.001;
	const roundedWeight = Math.round(weight * 100) / 100;
	return roundedWeight;
};

function getToolTip(canAfford: boolean, overWeight: boolean) {
	if (overWeight) return "Du kannst nicht alle Items tragen die im Warenkorb sind.";
	if (!canAfford) return "Du kannst dir nicht alle Items im Warenkorb leisten.";
}

function PaymentButtons() {
	const { CartItems, getShopItemData, cartWeight } = useStoreShop();
	const { Money, Weight, MaxWeight } = useStoreSelf();

	const { ShopItems, CurrentShop, clearCart, setShopItems } = useStoreShop();
	const [awaiting, setAwaiting] = useState(false);
	const [method, setMethod] = useState<"cash" | "card" | "society">("cash");

	const total = CartItems?.reduce((acc, item) => acc + getShopItemData(item.id).price * item.quantity, 0) || 0;
	const canAffordCash = total <= Money.Cash;
	const canAffordCard = total <= Money.Bank;
	const canAffordSociety = total <= Money.Society;
	const overWeight = Weight + cartWeight > MaxWeight;

	function finishPurchase() {
		const updatedShopItems = ShopItems.map((shopItem) => {
			const cartItem = CartItems.find((item) => item.id === shopItem.id);
			if (cartItem) {
				if (shopItem.count !== undefined) {
					return { ...shopItem, count: shopItem.count - cartItem.quantity };
				}
			}
			return shopItem;
		});

		setShopItems(updatedShopItems);

		clearCart();
	}

	return (
		<div className="flex w-full flex-col gap-3">
			{awaiting && <div className="container" />}
			<div className="flex w-full gap-2">
				<Button
					className={`group relative grow overflow-hidden rounded-xl bg-gradient-to-br from-green-700/20 to-green-800/20 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:from-green-600/30 hover:to-green-700/30 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[disabled=true]:grayscale ${method === "cash" ? "ring-2 ring-green-400 shadow-green-500/30" : ""}`}
					variant="secondary"
					data-disabled={!CartItems || CartItems.length === 0 || !canAffordCash || awaiting || overWeight}
					onClick={() => setMethod("cash")}
				>
					<div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
					<FontAwesomeIcon size="lg" icon={faMoneyBill1Wave} className="relative text-green-300" />
				</Button>
				<Button
					className={`group relative grow overflow-hidden rounded-xl bg-gradient-to-br from-blue-700/20 to-blue-800/20 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:from-blue-600/30 hover:to-blue-700/30 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[disabled=true]:grayscale ${method === "card" ? "ring-2 ring-blue-400 shadow-blue-500/30" : ""}`}
					variant="secondary"
					data-disabled={!CartItems || CartItems.length === 0 || !canAffordCard || awaiting || overWeight}
					onClick={() => setMethod("card")}
				>
					<div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
					<FontAwesomeIcon size="lg" icon={faCreditCard} className="relative text-blue-300" />
				</Button>
				{Money.Society > 0 && (
					<Button
						className={`group relative grow overflow-hidden rounded-xl bg-gradient-to-br from-orange-700/20 to-orange-800/20 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:from-orange-600/30 hover:to-orange-700/30 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[disabled=true]:grayscale ${method === "society" ? "ring-2 ring-orange-400 shadow-orange-500/30" : ""}`}
						variant="secondary"
						data-disabled={!CartItems || CartItems.length === 0 || !canAffordSociety || awaiting || overWeight}
						onClick={() => setMethod("society")}
					>
						<div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
						<FontAwesomeIcon size="lg" icon={faUsers} className="relative text-orange-300" />
					</Button>
				)}
			</div>
			<Button
				className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/40 to-emerald-700/40 py-4 text-base font-bold text-emerald-100 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:from-emerald-500/50 hover:to-emerald-600/50 hover:shadow-emerald-500/30 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[disabled=true]:grayscale"
				variant="secondary"
				data-disabled={
					!CartItems ||
					CartItems.length === 0 ||
					awaiting ||
					overWeight ||
					(method === "cash" && !canAffordCash) ||
					(method === "card" && !canAffordCard) ||
					(method === "society" && !canAffordSociety)
				}
				onClick={async () => {
					if (!CartItems || CartItems.length === 0 || awaiting) return;
					setAwaiting(true);
					const res = await fetchNui("purchaseItems", { items: CartItems, shop: CurrentShop, currency: method }, true);
					setAwaiting(false);
					if (res) {
						finishPurchase();
						clearCart();
					}
				}}
			>
				<div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
				<span className="relative">{awaiting ? <Loader /> : "💳 Jetzt bezahlen"}</span>
			</Button>
			<div className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-orange-900/30 to-orange-800/30 px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur-sm">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600/30">
					<FontAwesomeIcon size="sm" icon={faWeightHanging} className="text-orange-300" />
				</div>
				<span className="text-slate-200">
					{formatWeight(Weight)}kg
					{cartWeight > 0.0 && <span className="font-bold text-orange-300"> + {formatWeight(cartWeight)}kg</span>}
					<span className="text-orange-400"> / {formatWeight(MaxWeight)}kg</span>
				</span>
			</div>
		</div>
	);
}

export default function Cart() {
	const { CartItems, addItemToCart, removeItemFromCart, getShopItemData, cartWeight } = useStoreShop();
	const { Money, Weight, MaxWeight } = useStoreSelf();

	const cartPrice = CartItems?.reduce((acc, item) => acc + getShopItemData(item.id).price * item.quantity, 0);

	return (
		<div className="flex h-full w-[28%] min-w-[28%] flex-col justify-between gap-3 rounded-2xl bg-gradient-to-br from-slate-900/40 to-slate-950/40 p-4 shadow-2xl backdrop-blur-sm">
			<div className="mb-1 flex flex-col gap-3">
				<div className="flex items-center gap-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600/40 to-orange-700/40 shadow-lg">
						<FontAwesomeIcon size="lg" icon={faBasketShopping} className="text-orange-200" />
					</div>
					<h3 className="scroll-m-20 bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-2xl font-black tracking-tight text-transparent">
						Einkaufskorb
					</h3>
				</div>

				{CartItems && CartItems.length > 0 && (
					<div className="flex flex-col gap-2">
						<div className="rounded-xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 p-3 shadow-lg backdrop-blur-sm">
							<div className="text-xs font-semibold uppercase tracking-wider text-green-400/70">Gesamt</div>
							<div className="text-2xl font-black text-green-100">{cartPrice == 0 ? "💰 Kostenlos" : "$" + formatMoney(cartPrice)}</div>
						</div>
						<Button
							size="sm"
							variant="outline"
							className="gpu-accelerated group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-700/20 to-red-800/20 py-2.5 text-xs font-semibold text-red-300 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:from-red-600/30 hover:to-red-700/30 hover:shadow-red-500/20"
							onClick={() => {
								const { clearCart } = useStoreShop.getState();
								clearCart();
							}}
						>
							<div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
							<span className="relative">🗑️ Warenkorb leeren</span>
						</Button>
					</div>
				)}
			</div>
			<div className={`flex h-0 grow flex-col gap-2 ${CartItems?.length > 0 && "overflow-y-auto"}`}>
				{CartItems?.length <= 0 ? (
					<div className="my-auto flex flex-col items-center gap-4 rounded-xl bg-gradient-to-br from-orange-900/10 to-slate-800/10 p-8 backdrop-blur-sm">
						<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600/20 shadow-lg">
							<FontAwesomeIcon icon={faFaceFrown} size="2x" className="text-orange-400" />
						</div>
						<div className="text-center">
							<h1 className="mb-2 text-xl font-bold text-orange-200">Einkaufskorb ist leer</h1>
							<p className="text-sm text-orange-400/80">Füge Artikel hinzu, um sie zu kaufen</p>
						</div>
					</div>
				) : (
					<ScrollArea className="h-full">
						<div className="flex flex-col gap-2 pr-2">
							{CartItems?.map((item) => {
								const storeItem = getShopItemData(item.id);
								const price = storeItem.price;

								const handleQuantityChange = (value: number) => {
									if (value === item.quantity) return;

									const newCartValue =
										CartItems.reduce((acc, cartitem) => acc + getShopItemData(cartitem.id).price * cartitem.quantity, 0) +
										price * (value - item.quantity);
									const newCartWeight = Weight + cartWeight + (storeItem.weight || 0) * (value - item.quantity);

									const canAffordCash = newCartValue <= Money.Cash;
									const canAffordCard = newCartValue <= Money.Bank;
									const canAffordSociety = newCartValue <= Money.Society;
									const overWeight = newCartWeight > MaxWeight;

									if (overWeight) {
										toast.error(`You cannot add anymore of: ${storeItem.label} to your cart, it's too heavy!`, {
											icon: <FontAwesomeIcon icon={faWeightHanging} />,
										});
										return;
									}

									if (!canAffordCash && !canAffordCard && !canAffordSociety) {
										toast.error(`You cannot add anymore of: ${storeItem.label} to your cart, you cannot afford it!`, {
											icon: <FontAwesomeIcon icon={faMoneyBill1Wave} />,
										});
										return;
									}

									if (value > item.quantity) {
										addItemToCart(getShopItemData(item.id), value - item.quantity);
									} else {
										removeItemFromCart(item.id, item.quantity - value);
									}
								};

								return (
									<div
										className="group rounded-xl bg-gradient-to-r from-slate-800/40 to-slate-900/40 p-3 shadow-lg backdrop-blur-sm transition-all duration-200 hover:from-slate-800/60 hover:to-slate-900/60"
										key={item.id}
									>
										<div className="mb-2 flex items-center justify-between">
											<div className="flex-1 font-semibold text-slate-100">{storeItem.label}</div>
											<div className="rounded-lg bg-green-600/30 px-3 py-1.5 backdrop-blur-sm">
												<span className="text-sm font-bold text-green-100">${formatMoney(price * item.quantity)}</span>
											</div>
										</div>
										<div className="flex items-center justify-between gap-2">
											<NumberInput
												value={item.quantity}
												max={storeItem.count}
												clampBehavior="strict"
												startValue={1}
												onChange={handleQuantityChange}
												isAllowed={(values) => {
													const newCartValue =
														CartItems.reduce((acc, cartitem) => acc + getShopItemData(cartitem.id).price * cartitem.quantity, 0) +
														price * (values.floatValue - item.quantity);
													const newCartWeight = Weight + cartWeight + (storeItem.weight || 0) * (values.floatValue - item.quantity);

													const canAffordCash = newCartValue <= Money.Cash;
													const canAffordCard = newCartValue <= Money.Bank;
													const overWeight = newCartWeight > MaxWeight;

													if (overWeight) {
														toast.error(`You cannot add anymore of: ${storeItem.label} to your cart, it's too heavy!`, {
															icon: <FontAwesomeIcon icon={faWeightHanging} />,
														});

														return false;
													}

													if (!canAffordCash && !canAffordCard) {
														toast.error(`You cannot add anymore of: ${storeItem.label} to your cart, you cannot afford it!`, {
															icon: <FontAwesomeIcon icon={faMoneyBill1Wave} />,
														});
														return false;
													}

													return true;
												}}
												min={1}
												allowDecimal={false}
												allowNegative={false}
											/>
											<Button
												className="gpu-accelerated smooth-transition h-9 w-9 rounded-lg bg-red-700/30 text-red-200 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-red-600/40 hover:shadow-red-500/20"
												variant="secondary"
												onClick={() => {
													removeItemFromCart(item.id, null, true);
												}}
											>
												<FontAwesomeIcon icon={faXmark} size="sm" />
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					</ScrollArea>
				)}
			</div>
			<PaymentButtons />
		</div>
	);
}
