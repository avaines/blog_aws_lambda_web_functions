import Link from "next/link";
import { notFound } from "next/navigation";
import { menu, money } from "@/lib/menu";
import PageShell from "@/components/page-shell";
export function generateStaticParams() {
  return menu.map((dish) => ({ slug: dish.id }));
}
export const dynamicParams = false;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const selected = menu.find((d) => d.id === slug);
  return {
    title: selected ? `${selected.name} | Fin & Feast` : "Dish not found",
  };
}
export default async function Dish({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dish = menu.find((d) => d.id === slug);
  if (!dish) notFound();
  return (
    <PageShell>
      <div className="dish-detail-layout">
        <div className={`dish-art ${dish.color}`}>
          <span className="dish-tag">{dish.tag}</span>
          <div className="plate">
            <span aria-hidden="true">{dish.emoji}</span>
          </div>
        </div>
        <section>
          <span className="eyebrow">{dish.category}</span>
          <h1>{dish.name}</h1>
          <p>{dish.description}</p>
          <p>{dish.detail}</p>
          <h2>{money(dish.price)}</h2>
          <Link className="primary" href={`/?dish=${dish.id}#menu`}>
            Choose this dish →
          </Link>
          <p className="route-note">
            A fictional fish feast. For the demo, all dishes are always on the
            menu.
          </p>
        </section>
      </div>
      <h2>More little delights</h2>
      <div className="related-dishes">
        {menu
          .filter((d) => d.id !== slug)
          .slice(0, 3)
          .map((d) => (
            <Link key={d.id} href={`/menu/${d.id}`} className="dish">
              <span>{d.emoji}</span>
              <h3>{d.name}</h3>
              <p>{money(d.price)} · View dish →</p>
            </Link>
          ))}
      </div>
    </PageShell>
  );
}
