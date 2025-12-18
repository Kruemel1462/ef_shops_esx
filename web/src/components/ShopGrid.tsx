import { useEffect, useMemo, useState } from "react";
import { useStoreShop } from "../stores/ShopStore";
import ItemCard from "./ItemCard";
import { TooltipProvider } from "./ui/tooltip";
import Loader from "./Loader";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { fetchNui } from "../utils/fetchNui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faCircleExclamation, faRotateRight, faSearch } from "@fortawesome/free-solid-svg-icons";

function ShopTab({ tab, filter }: { tab: string; filter: string }) {
	const { categorizedItems, inventoryCategorized, SellingMode } = useStoreShop();
	const items = SellingMode ? inventoryCategorized : categorizedItems;

	const lowerFilter = filter.toLowerCase();

	const filtered = useMemo(
		() =>
			items[tab]?.filter((item) => item.label.toLowerCase().includes(lowerFilter) || item.name.toLowerCase().includes(lowerFilter)) || [],
		[items, tab, lowerFilter],
	);

	return useMemo(() => filtered.map((item) => <ItemCard key={item.id} item={item} />), [filtered]);
}

export default function ShopGrid() {
	const { ShopItems, categorizedItems, InventoryItems, inventoryCategorized, SellingMode, CurrentShop } = useStoreShop();
	const items = SellingMode ? InventoryItems : ShopItems;
	const categories = SellingMode ? inventoryCategorized : categorizedItems;
	const [activeTab, setActiveTab] = useState<string>(Object.keys(categories)[0] || "Misc");
	const [searchText, setSearchText] = useState<string>("");

	useEffect(() => {
		setActiveTab(Object.keys(categories)[0] || "Misc");
	}, [categories]);

	if (!items)
		return (
			<div className="flex size-full flex-col items-center justify-center">
				<Loader />
			</div>
		);

	if (items.length <= 0)
		return (
			<div className="flex size-full flex-col items-center justify-center gap-4">
				<div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
					<FontAwesomeIcon
						icon={SellingMode ? faBoxOpen : faCircleExclamation}
						className={SellingMode ? "text-amber-400" : "text-red-400"}
						size="lg"
					/>
					<div>
						<div className="text-sm font-semibold text-white">{SellingMode ? "No items to sell" : "No items available"}</div>
						<div className="text-xs text-zinc-400">
							{SellingMode
								? "Items that can be sold will appear here"
								: "This store has no items available right now"}
						</div>
					</div>
				</div>
				{SellingMode && (
					<Button
						size="sm"
						variant="ghost"
						className="gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 text-sm text-zinc-300 transition-colors hover:border-orange-700 hover:bg-orange-950/30 hover:text-orange-400"
						onClick={() => fetchNui("getInventory", { shop: CurrentShop?.id })}
					>
						<FontAwesomeIcon icon={faRotateRight} className="text-xs" />
						Refresh Inventory
					</Button>
				)}
			</div>
		);

	return (
		<div className="flex size-full flex-col gap-2.5">
			{/* Search Bar */}
			<div className="relative">
				<FontAwesomeIcon icon={faSearch} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500" />
				<input
					type="text"
					placeholder="Search items..."
					value={searchText}
					onChange={(e) => {
						setSearchText(e.target.value);
					}}
					className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2 pl-9 pr-9 text-sm text-white placeholder-zinc-500 transition-colors focus:border-orange-500/50 focus:bg-zinc-900 focus:outline-none"
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							setSearchText("");
						}
					}}
				/>
				{searchText && (
					<button
						onClick={() => setSearchText("")}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
					>
						✕
					</button>
				)}
			</div>

			{/* Category Tabs */}
			<div className="flex gap-1.5 overflow-x-auto">
				{Object.keys(categories).map((category) => (
					<button
						key={category}
						onClick={() => setActiveTab(category)}
						className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
							activeTab === category
								? "border-orange-500/50 bg-orange-950/30 text-orange-400"
								: "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
						}`}
					>
						{category}
					</button>
				))}
			</div>

			{/* Items Grid */}
			<ScrollArea className="h-0 flex-1">
				<div className="grid grid-cols-4 gap-2.5 pr-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
					<TooltipProvider delayDuration={0} disableHoverableContent={true}>
						<ShopTab tab={activeTab} filter={searchText} />
					</TooltipProvider>
				</div>
			</ScrollArea>
		</div>
	);
}
