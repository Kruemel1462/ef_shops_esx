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
						className={`grow ${method === 'cash' ? 'ring-1 ring-green-400' : ''} bg-green-700/20 text-green-300 hover:bg-green-800/20 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:brightness-50`}
						variant="secondary"
						data-disabled={!CartItems || CartItems.length === 0 || !canAffordCash || awaiting || overWeight}
						onClick={() => setMethod('cash')}
					>
						<FontAwesomeIcon size="lg" icon={faMoneyBill1Wave} />
					</Button>
					<Button
						className={`grow ${method === 'card' ? 'ring-1 ring-blue-400' : ''} bg-blue-700/20 text-blue-300 hover:bg-blue-800/20 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:brightness-50`}
						variant="secondary"
						data-disabled={!CartItems || CartItems.length === 0 || !canAffordCard || awaiting || overWeight}
						onClick={() => setMethod('card')}
					>
						<FontAwesomeIcon size="lg" icon={faCreditCard} />
					</Button>
					{Money.Society > 0 && (
						<Button
							className={`grow ${method === 'society' ? 'ring-1 ring-orange-400' : ''} bg-orange-700/20 text-orange-300 hover:bg-orange-800/20 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:brightness-50`}
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
						className="w-full bg-emerald-700/30 text-emerald-300 hover:bg-emerald-800/30 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:brightness-50"
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
						{awaiting ? <Loader /> : 'Jetzt bezahlen'}
					</Button>
				</div>
				<p className="mt-1 flex items-center justify-center gap-1 rounded-sm bg-indigo-800/20 px-2 py-1 text-lg font-medium text-indigo-400">
					<FontAwesomeIcon size="xs" icon={faWeightHanging} />
					{formatWeight(Weight) + 'kg'}
					{cartWeight > 0.0 && <span className="font-bold">{' + ' + formatWeight(cartWeight) + 'kg'}</span>}
					{' / ' + formatWeight(MaxWeight) + 'kg'}
				</p>
			</div>
		);
}

export default function Cart() {
	const { CartItems, addItemToCart, removeItemFromCart, getShopItemData, cartWeight } = useStoreShop();
	const { Money, Weight, MaxWeight } = useStoreSelf();

	const cartPrice = CartItems?.reduce((acc, item) => acc + getShopItemData(item.id).price * item.quantity, 0);

	return (
		<div className="flex h-full w-[25%] min-w-[25%] flex-col justify-between gap-1">
			<div className="flex justify-between gap-1">
				<div className="mx-2 flex items-center gap-2 leading-none">
					<FontAwesomeIcon size="lg" icon={faBasketShopping} />
					<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Einkaufskorb</h3>
				</div>

				{CartItems && CartItems.length > 0 && (
					<div className="mx-2 my-auto text-xl font-semibold tracking-tight">
						{"Gesamt: "}
						<span className="font-bold">{cartPrice == 0 ? "Kostenlos" : "$" + formatMoney(cartPrice)}</span>
					</div>
				)}
			</div>
			<div className={`flex h-0 grow flex-col gap-3 ${CartItems?.length > 0 && "overflow-y-auto"}`}>
				{CartItems?.length <= 0 ? (
					<div className="my-auto flex flex-col items-center gap-1">
						<FontAwesomeIcon icon={faFaceFrown} size="2x" />
						<h1 className="text-2xl font-bold">Keine Waren im Einkaufskorb</h1>
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
								<div className="mx-1 p-2" key={item.id}>
									<div className="flex w-full flex-nowrap items-center justify-between">
										<div className="font-semibold tracking-tight">{storeItem.label}</div>
										<div className="flex w-min shrink flex-nowrap items-center gap-2 font-semibold tracking-tight">
											<div>${formatMoney(price * item.quantity)}</div>
											<div className="flex flex-nowrap items-center gap-1">
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
													className="size-8 bg-red-700/20 text-red-300 hover:bg-red-800/20"
													variant="secondary"
													onClick={() => {
														removeItemFromCart(item.id, null, true);
													}}
												>
													<FontAwesomeIcon icon={faXmark} size="lg" />
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
