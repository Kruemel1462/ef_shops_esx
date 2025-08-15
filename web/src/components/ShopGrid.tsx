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
import { faBoxOpen, faCircleExclamation, faRotateRight, faSearch } from "@fortawesome/free-solid-svg-icons";

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
                        <div className="flex size-full flex-col items-center justify-center gap-4">
                                <div className="flex flex-col items-center gap-4 rounded-xl bg-gradient-to-br from-card/60 to-card/40 p-8 backdrop-blur-sm border border-border/50 shadow-lg max-w-md text-center">
                                        <div className="rounded-full bg-primary/10 p-4">
                                                <FontAwesomeIcon 
                                                        icon={SellingMode ? faBoxOpen : faCircleExclamation} 
                                                        className={`${SellingMode ? "text-amber-400" : "text-red-400"} text-3xl`} 
                                                />
                                        </div>
                                        <div>
                                                <h3 className="text-xl font-semibold mb-2">
                                                        {SellingMode ? 'Keine passenden Items zum Verkaufen' : 'Keine Artikel verfügbar'}
                                                </h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {SellingMode ? 'Verkaufsfähige Items werden hier angezeigt, sobald sie im Inventar sind.' : 'Der Shop hat aktuell keine verfügbaren Artikel.'}
                                                </p>
                                        </div>
                                        {SellingMode && (
                                                <Button
                                                        className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/20 hover:border-indigo-500/30"
                                                        variant="secondary"
                                                        onClick={() => fetchNui('getInventory', { shop: CurrentShop?.id })}
                                                >
                                                        <FontAwesomeIcon icon={faRotateRight} className="mr-2" /> Inventar aktualisieren
                                                </Button>
                                        )}
                                </div>
                        </div>
                );

        return (
                <div className="flex size-full flex-col gap-4">
                        {/* Enhanced Search Input */}
                        <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <FontAwesomeIcon icon={faSearch} className="text-muted-foreground text-sm" />
                                </div>
                                <input
                                        type="text"
                                        placeholder="Suche nach Items..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                                />
                        </div>

                        {/* Enhanced Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex size-full flex-col">
                                <TabsList className="justify-start bg-background/30 backdrop-blur-sm border border-border/30 rounded-xl p-1">
                                        {Object.keys(categories).map((category) => (
                                                <TabsTrigger 
                                                        value={category} 
                                                        key={category} 
                                                        className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200"
                                                >
                                                        {category}
                                                </TabsTrigger>
                                        ))}
                                </TabsList>

                                {/* Responsive Grid Content */}
                                <TabsContent value={activeTab} className="flex size-full flex-col mt-4">
                                        <ScrollArea className="h-0 grow">
                                                <div className="grid h-full w-full grow gap-4 px-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
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
