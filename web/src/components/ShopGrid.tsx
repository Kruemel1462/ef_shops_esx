import { useEffect, useMemo, useState } from "react";
import { useStoreShop } from "../stores/ShopStore";
import ItemCard from "./ItemCard";
import { TooltipProvider } from "./ui/tooltip";
import Loader from "./Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { fetchNui } from "../utils/fetchNui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faCircleExclamation, faRotateRight } from "@fortawesome/free-solid-svg-icons";

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
			<div className="flex size-full flex-col items-center justify-center gap-3">
				<div className="flex items-center gap-3 rounded-md bg-card/40 px-4 py-3 shadow-sm">
					<FontAwesomeIcon
						icon={SellingMode ? faBoxOpen : faCircleExclamation}
						className={SellingMode ? "text-amber-400" : "text-red-400"}
						size="lg"
					/>
					<div className="text-center">
						<div className="text-xl font-semibold">{SellingMode ? "Keine passenden Items zum Verkaufen" : "Keine Artikel verfügbar"}</div>
						<div className="text-sm text-muted-foreground">
							{SellingMode
								? "Verkaufsfähige Items werden hier angezeigt, sobald sie im Inventar sind."
								: "Der Shop hat aktuell keine verfügbaren Artikel."}
						</div>
					</div>
				</div>
				{SellingMode && (
					<Button
						className="bg-orange-700/20 text-orange-300 hover:bg-orange-800/20"
						variant="secondary"
						onClick={() => fetchNui("getInventory", { shop: CurrentShop?.id })}
					>
						<FontAwesomeIcon icon={faRotateRight} className="mr-2" /> Inventar aktualisieren
					</Button>
				)}
			</div>
		);

	return (
		<div className="flex size-full flex-col">
			<div className="relative mb-3">
				<input
					type="text"
					placeholder="🔍 Suche... (Shortcuts: !waffe, !essen, !trinken)"
					value={searchText}
					onChange={(e) => {
						let value = e.target.value;
						// Shortcuts für schnelle Suche
						if (value.startsWith("!waffe")) {
							setActiveTab("Firearms");
							value = "";
						} else if (value.startsWith("!essen")) {
							setActiveTab("Food");
							value = "";
						} else if (value.startsWith("!trinken")) {
							setActiveTab("Drinks");
							value = "";
						} else if (value.startsWith("!muni")) {
							setActiveTab("Ammunition");
							value = "";
						}
						setSearchText(value);
					}}
					className="w-full rounded-lg bg-background/80 px-4 py-3 text-sm backdrop-blur-sm transition-all duration-300 placeholder:text-gray-400 focus:outline-none"
					onKeyDown={(e) => {
						// ESC zum Leeren
						if (e.key === "Escape") {
							setSearchText("");
						}
					}}
				/>
				{searchText && (
					<button
						onClick={() => setSearchText("")}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 hover:text-orange-400"
						title="ESC oder hier klicken zum Leeren"
					>
						✕
					</button>
				)}
			</div>
			<Tabs value={activeTab} onValueChange={setActiveTab} className="flex size-full flex-col">
				<TabsList className="mb-2 justify-start rounded-lg bg-gradient-to-r from-orange-900/20 to-orange-800/20 p-1 backdrop-blur-sm">
					{Object.keys(categories).map((category) => (
						<TabsTrigger
							value={category}
							key={category}
							className="rounded-md px-4 py-2 font-medium transition-all duration-300 hover:bg-orange-700/20 data-[state=active]:bg-orange-600/40 data-[state=active]:text-orange-100 data-[state=active]:shadow-lg"
						>
							{category}
						</TabsTrigger>
					))}
				</TabsList>
				<TabsContent value={activeTab} className="flex size-full flex-col">
					<ScrollArea className="h-0 grow">
						<div className="grid h-full w-full grow grid-cols-6 gap-4 px-4 py-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
							<TooltipProvider delayDuration={0} disableHoverableContent={true}>
								<ShopTab tab={activeTab} filter={searchText} />
							</TooltipProvider>
						</div>
					</ScrollArea>
				</TabsContent>
			</Tabs>
		</div>
	);
}
