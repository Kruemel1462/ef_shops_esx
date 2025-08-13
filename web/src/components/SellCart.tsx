import { faMoneyBill1Wave, faFaceFrown, faXmark, faShoppingBag } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useStoreShop } from "../stores/ShopStore";
import { formatMoney } from "../utils/misc";
import { useState } from "react";
import { fetchNui } from "../utils/fetchNui";
import { Button } from "./ui/button";
import NumberInput from "./ui/number-input";
import Loader from "./Loader";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";

function SellButton() {
	const { SellCartItems, getInventoryItemData, CurrentShop, clearSellCart, setInventoryItems, InventoryItems } = useStoreShop();
	const [awaitingSell, setAwaitingSell] = useState(false);

	const sellValue = SellCartItems?.reduce((acc, item) => acc + (getInventoryItemData(item.id)?.price || 0) * item.quantity, 0) || 0;

	function finishSale() {
		// Update inventory by removing sold items
		if (InventoryItems) {
			const updatedInventoryItems = InventoryItems.map((inventoryItem) => {
				const sellItem = SellCartItems.find((item) => item.id === inventoryItem.id);
				if (sellItem) {
					const newCount = (inventoryItem.count || 0) - sellItem.quantity;
					return newCount <= 0 ? null : { ...inventoryItem, count: newCount };
				}
				return inventoryItem;
			}).filter(Boolean) as typeof InventoryItems;

			setInventoryItems(updatedInventoryItems);
		}
		clearSellCart();
	}

	return (
		<div className="flex w-full flex-col justify-between">
			{awaitingSell && <div className="container" />}
			<div className="flex w-full">
				<Button
					className="grow bg-green-700/20 text-green-300 hover:bg-green-800/20 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:brightness-50 data-[disabled=true]:hover:bg-green-700/20"
					variant="secondary"
					data-disabled={!SellCartItems || SellCartItems.length === 0 || awaitingSell}
					onClick={async () => {
						if (!SellCartItems || SellCartItems.length === 0 || awaitingSell) return;

						setAwaitingSell(true);
						
						// Try to use the new sellItems endpoint, fallback to individual sellItem calls
						try {
							const res = await fetchNui("sellItems", { items: SellCartItems, shop: CurrentShop?.id }, true);
							setAwaitingSell(false);
							if (res) {
								finishSale();
								toast.success(`Erfolgreich Items für $${formatMoney(sellValue)} verkauft!`, {
									icon: <FontAwesomeIcon icon={faMoneyBill1Wave} />,
								});
							}
						} catch (error) {
							// Fallback: sell items individually
							console.log("sellItems not available, falling back to individual sells");
							let allSuccessful = true;
							
							for (const item of SellCartItems) {
								const inventoryItem = getInventoryItemData(item.id);
								if (inventoryItem) {
									for (let i = 0; i < item.quantity; i++) {
										try {
											const res = await fetchNui("sellItem", { name: inventoryItem.name, shop: CurrentShop?.id }, true);
											if (!res) {
												allSuccessful = false;
												break;
											}
										} catch (e) {
											allSuccessful = false;
											break;
										}
									}
								}
								if (!allSuccessful) break;
							}
							
							setAwaitingSell(false);
							if (allSuccessful) {
								finishSale();
								toast.success(`Erfolgreich Items für $${formatMoney(sellValue)} verkauft!`, {
									icon: <FontAwesomeIcon icon={faMoneyBill1Wave} />,
								});
								// Refresh inventory after selling
								fetchNui("getInventory", { shop: CurrentShop?.id });
							} else {
								toast.error("Fehler beim Verkaufen der Items!");
							}
						}
					}}
				>
					{awaitingSell ? <Loader /> : <FontAwesomeIcon size="lg" icon={faMoneyBill1Wave} />}
					{!awaitingSell && " Verkaufen"}
				</Button>
			</div>
		</div>
	);
}

export default function SellCart() {
	const { SellCartItems, addItemToSellCart, removeItemFromSellCart, getInventoryItemData } = useStoreShop();

	const sellValue = SellCartItems?.reduce((acc, item) => acc + (getInventoryItemData(item.id)?.price || 0) * item.quantity, 0) || 0;

  return (
		<div className="flex h-full w-[25%] min-w-[25%] flex-col justify-between gap-1">
			<div className="flex justify-between gap-1">
				<div className="mx-2 flex items-center gap-2 leading-none">
					<FontAwesomeIcon size="lg" icon={faShoppingBag} />
					<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Verkaufskorb</h3>
				</div>

				{SellCartItems && SellCartItems.length > 0 && (
					<div className="mx-2 my-auto text-xl font-semibold tracking-tight">
						{"Gesamt: "}
						<span className="font-bold">{sellValue === 0 ? "Kostenlos" : "$" + formatMoney(sellValue)}</span>
					</div>
				)}
			</div>
			<div className={`flex h-0 grow flex-col gap-3 ${SellCartItems?.length > 0 && "overflow-y-auto"}`}>
				{SellCartItems?.length <= 0 ? (
					<div className="my-auto flex flex-col items-center gap-1">
						<FontAwesomeIcon icon={faFaceFrown} size="2x" />
						<h1 className="text-2xl font-bold">Keine Items zum Verkaufen</h1>
					</div>
				) : (
					<ScrollArea className="h-full">
						{SellCartItems?.map((item) => {
							const inventoryItem = getInventoryItemData(item.id);
							if (!inventoryItem) return null;
							
							const price = inventoryItem.price || 0;

							const handleQuantityChange = (value: number) => {
								if (value === item.quantity) return;

								// Check if we have enough items in inventory
								const maxAvailable = inventoryItem.count || 0;
								if (value > maxAvailable) {
									toast.error(`Du kannst nur maximal ${maxAvailable}x ${inventoryItem.label} verkaufen!`);
									return;
								}

								if (value > item.quantity) {
									addItemToSellCart(inventoryItem, value - item.quantity);
								} else {
									removeItemFromSellCart(item.id, item.quantity - value);
								}
							};

							return (
								<div className="mx-1 p-2" key={item.id}>
									<div className="flex w-full flex-nowrap items-center justify-between">
										<div className="font-semibold tracking-tight">{inventoryItem.label}</div>
										<div className="flex w-min shrink flex-nowrap items-center gap-2 font-semibold tracking-tight">
											<div>${formatMoney(price * item.quantity)}</div>
											<div className="flex flex-nowrap items-center gap-1">
												<NumberInput
													value={item.quantity}
													max={inventoryItem.count}
													clampBehavior="strict"
													startValue={1}
													onChange={handleQuantityChange}
													isAllowed={(values) => {
														const maxAvailable = inventoryItem.count || 0;
														if (values.floatValue > maxAvailable) {
															toast.error(`Du kannst nur maximal ${maxAvailable}x ${inventoryItem.label} verkaufen!`);
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
														removeItemFromSellCart(item.id, 0, true);
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
      <SellButton />
		</div>
	);
}
