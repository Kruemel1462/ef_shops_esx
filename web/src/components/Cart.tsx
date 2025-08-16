import { faBasketShopping, faCreditCard, faFaceFrown, faMoneyBill1Wave, faWeightHanging, faXmark, faUsers } from "@fortawesome/free-solid-svg-icons";
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
	const [method, setMethod] = useState<'cash' | 'card' | 'society'>('cash');

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
			<div className="flex w-full flex-col justify-between">
				{awaiting && <div className="container" />}
				<div className="flex w-full gap-1">
					<Button
						className={`grow transition-all duration-200 ${method === 'cash' ? 'ring-2 ring-green-400 shadow-lg shadow-green-500/20' : ''} bg-green-700/20 text-green-300 hover:bg-green-800/20 hover:shadow-lg hover:shadow-green-500/10 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:brightness-50`}
						variant="secondary"
						data-disabled={!CartItems || CartItems.length === 0 || !canAffordCash || awaiting || overWeight}
						onClick={() => setMethod('cash')}
					>
						<FontAwesomeIcon size="lg" icon={faMoneyBill1Wave} />
					</Button>
					<Button
						className={`grow transition-all duration-200 ${method === 'card' ? 'ring-2 ring-blue-400 shadow-lg shadow-blue-500/20' : ''} bg-blue-700/20 text-blue-300 hover:bg-blue-800/20 hover:shadow-lg hover:shadow-blue-500/10 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:brightness-50`}
						variant="secondary"
						data-disabled={!CartItems || CartItems.length === 0 || !canAffordCard || awaiting || overWeight}
						onClick={() => setMethod('card')}
					>
						<FontAwesomeIcon size="lg" icon={faCreditCard} />
					</Button>
					{Money.Society > 0 && (
						<Button
							className={`grow transition-all duration-200 ${method === 'society' ? 'ring-2 ring-orange-400 shadow-lg shadow-orange-500/20' : ''} bg-orange-700/20 text-orange-300 hover:bg-orange-800/20 hover:shadow-lg hover:shadow-orange-500/10 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:brightness-50`}
							variant="secondary"
							data-disabled={!CartItems || CartItems.length === 0 || !canAffordSociety || awaiting || overWeight}
							onClick={() => setMethod('society')}
						>
							<FontAwesomeIcon size="lg" icon={faUsers} />
						</Button>
					)}
				</div>
				<div className="mt-2">
					<Button
						className="w-full bg-gradient-to-r from-emerald-600/40 to-emerald-700/40 text-emerald-100 hover:from-emerald-500/50 hover:to-emerald-600/50 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 border border-emerald-500/30 backdrop-blur-sm font-bold py-3 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:brightness-50 data-[disabled=true]:grayscale"
						variant="secondary"
						data-disabled={!CartItems || CartItems.length === 0 || awaiting || overWeight || (method === 'cash' && !canAffordCash) || (method === 'card' && !canAffordCard) || (method === 'society' && !canAffordSociety)}
						onClick={async () => {
							if (!CartItems || CartItems.length === 0 || awaiting) return;
							setAwaiting(true);
							const res = await fetchNui('purchaseItems', { items: CartItems, shop: CurrentShop, currency: method }, true);
							setAwaiting(false);
							if (res) {
								finishPurchase();
								clearCart();
							}
						}}
					>
						{awaiting ? <Loader /> : '💳 Jetzt bezahlen'}
					</Button>
				</div>
				<div className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-800/30 to-purple-800/30 backdrop-blur-sm px-3 py-2 text-sm font-medium text-indigo-300 border border-indigo-500/20">
					<FontAwesomeIcon size="sm" icon={faWeightHanging} className="text-indigo-400" />
					<span className="text-indigo-200">
						{formatWeight(Weight)}kg
						{cartWeight > 0.0 && <span className="font-bold text-purple-300"> + {formatWeight(cartWeight)}kg</span>}
						<span className="text-indigo-400"> / {formatWeight(MaxWeight)}kg</span>
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
		<div className="flex h-full w-[25%] min-w-[25%] flex-col justify-between gap-1">
			<div className="flex justify-between items-center gap-2 mb-2">
				<div className="mx-2 flex items-center gap-3 leading-none">
					<div className="p-2 rounded-lg bg-purple-600/30 backdrop-blur-sm border border-purple-500/30">
						<FontAwesomeIcon size="lg" icon={faBasketShopping} className="text-purple-300" />
					</div>
					<h3 className="scroll-m-20 text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Einkaufskorb</h3>
				</div>

				{CartItems && CartItems.length > 0 && (
					<div className="mx-2 bg-gradient-to-r from-green-600/30 to-emerald-600/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-green-500/30">
						<div className="text-sm text-green-300 font-medium">Gesamt:</div>
						<div className="text-lg font-bold text-green-100">
							{cartPrice == 0 ? "💰 Kostenlos" : "$" + formatMoney(cartPrice)}
						</div>
					</div>
				)}
			</div>
			<div className={`flex h-0 grow flex-col gap-3 ${CartItems?.length > 0 && "overflow-y-auto"}`}>
				{CartItems?.length <= 0 ? (
					<div className="my-auto flex flex-col items-center gap-3 p-6 rounded-lg bg-gradient-to-br from-purple-900/20 to-gray-800/20 backdrop-blur-sm border border-purple-500/20">
						<div className="p-4 rounded-full bg-purple-600/20 border border-purple-500/30">
							<FontAwesomeIcon icon={faFaceFrown} size="2x" className="text-purple-400" />
						</div>
						<div className="text-center">
							<h1 className="text-xl font-bold text-purple-200 mb-1">Einkaufskorb ist leer</h1>
							<p className="text-sm text-purple-400">Füge Artikel hinzu, um sie zu kaufen</p>
						</div>
					</div>
				) : (
					<ScrollArea className="h-full">
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
								<div className="mx-1 p-3 rounded-lg bg-gradient-to-r from-card/40 to-card/20 backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/30 transition-all duration-200" key={item.id}>
									<div className="flex w-full flex-nowrap items-center justify-between">
										<div className="font-semibold tracking-tight text-purple-100 flex-1">{storeItem.label}</div>
										<div className="flex w-min shrink flex-nowrap items-center gap-3 font-semibold tracking-tight">
											<div className="bg-green-600/30 backdrop-blur-sm px-2 py-1 rounded-md border border-green-500/30">
												<span className="text-green-200 font-bold">${formatMoney(price * item.quantity)}</span>
											</div>
											<div className="flex flex-nowrap items-center gap-2">
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
													className="size-8 bg-red-700/30 text-red-200 hover:bg-red-600/40 border border-red-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-200"
													variant="secondary"
													onClick={() => {
														removeItemFromCart(item.id, null, true);
													}}
												>
													<FontAwesomeIcon icon={faXmark} size="sm" />
												</Button>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</ScrollArea>
				)}
			</div>
			<PaymentButtons />
		</div>
	);
}
