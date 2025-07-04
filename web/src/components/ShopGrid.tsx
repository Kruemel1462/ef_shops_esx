import { useEffect, useMemo, useState } from "react";
import { useStoreShop } from "../stores/ShopStore";
import ItemCard from "./ItemCard";
import { TooltipProvider } from "./ui/tooltip";
import Loader from "./Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "./ui/scroll-area";

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
        const { ShopItems, categorizedItems, InventoryItems, inventoryCategorized, SellingMode } = useStoreShop();
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
                        <div className="flex size-full scroll-m-20 flex-col items-center justify-center text-2xl font-semibold tracking-tight">
                                There are no items in this shop!
                        </div>
                );

        return (
                <div className="flex size-full flex-col">
                        <input
                                type="text"
                                placeholder="Search..."
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
