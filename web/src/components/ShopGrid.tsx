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
                        items[tab]?.filter(
                                (item) =>
                                        item.label.toLowerCase().includes(lowerFilter) ||
                                        item.name.toLowerCase().includes(lowerFilter),
                        ) || [],
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
                                        <FontAwesomeIcon icon={SellingMode ? faBoxOpen : faCircleExclamation} className={SellingMode ? "text-amber-400" : "text-red-400"} size="lg" />
                                        <div className="text-center">
                                                <div className="text-xl font-semibold">
                                                        {SellingMode ? 'Keine passenden Items zum Verkaufen' : 'Keine Artikel verfügbar'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                        {SellingMode ? 'Verkaufsfähige Items werden hier angezeigt, sobald sie im Inventar sind.' : 'Der Shop hat aktuell keine verfügbaren Artikel.'}
                                                </div>
                                        </div>
                                </div>
                                {SellingMode && (
                                        <Button
                                                className="bg-indigo-700/20 text-indigo-300 hover:bg-indigo-800/20"
                                                variant="secondary"
                                                onClick={() => fetchNui('getInventory', { shop: CurrentShop?.id })}
                                        >
                                                <FontAwesomeIcon icon={faRotateRight} className="mr-2" /> Inventar aktualisieren
                                        </Button>
                                )}
                        </div>
                );

        return (
                <div className="flex size-full flex-col">
                        <input
                                type="text"
                                placeholder="Suche..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="mb-2 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none"
                        />
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex size-full flex-col">
                                <TabsList className="justify-start bg-transparent">
                                        {Object.keys(categories).map((category) => (
                                                <TabsTrigger value={category} key={category} className="rounded-none border-primary data-[state=active]:border-b-2">
                                                        {category}
                                                </TabsTrigger>
                                        ))}
                                </TabsList>
                                <TabsContent value={activeTab} className="flex size-full flex-col">
                                        <ScrollArea className="h-0 grow">
                                                <div className="grid h-full w-full grow grid-cols-7 gap-3 px-4">
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
