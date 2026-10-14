"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import {
  Fish,
  ShoppingBag,
  ArrowRight,
  Plus,
  Minus,
  MapPin,
  Search,
  Clock3,
  Waves,
  X,
  Leaf,
} from "lucide-react";
import { menu, categories, money, deliveryFee } from "@/lib/menu";
type Cart = Record<string, number>;
export default function Shop({
  region,
  delivery,
  initialSearch = "",
}: {
  initialSearch?: string;
  region: string;
  delivery: ReactNode;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>({});
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState("All dishes");
  const [search, setSearch] = useState(initialSearch);
  const [checkout, setCheckout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("fin-basket") || "{}");
      const valid: Cart = {};
      for (const dish of menu)
        if (
          Number.isInteger(saved?.[dish.id]) &&
          saved[dish.id] > 0 &&
          saved[dish.id] <= 20
        )
          valid[dish.id] = saved[dish.id];
      setCart(valid);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("fin-basket", JSON.stringify(cart));
      } catch {}
    }
  }, [cart, ready]);
  const count = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const subtotal = menu.reduce(
    (sum, d) => sum + d.price * (cart[d.id] || 0),
    0,
  );
  function change(id: string, delta: number) {
    setCart((old) => {
      const next = {
        ...old,
        [id]: Math.max(0, Math.min(20, (old[id] || 0) + delta)),
      };
      if (!next[id]) delete next[id];
      return next;
    });
  }
  async function order(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          address: form.get("address"),
          items: Object.entries(cart).map(([id, quantity]) => ({
            id,
            quantity,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCart({});
      setCheckout(false);
      try {
        localStorage.setItem("fin-basket", "{}");
      } catch {}
      router.push(`/orders/${data.id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The current is a little choppy. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const dishes = menu.filter(
    (d) =>
      (category === "All dishes" || d.category === category) &&
      `${d.name} ${d.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="announcement">
        A little delivery. A whole lot of fin-flapping. <span>✦</span> Made for
        the small fry.
      </div>
      <header>
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Fish />
          </span>
          fin<span className="amp">&</span>feast
          <span className="brand-period">.</span>
        </Link>
        <nav>
          <a className="nav-active" href="#menu">
            Our menu
          </a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <a href="#basket" className="basket-link">
          <ShoppingBag size={18} />
          <span>Your bowl</span>
          <b>{count}</b>
        </a>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span /> FRESH FROM THE REEF
            </span>
            <h1>
              Big flavours.
              <br />
              Tiny <em>mouths.</em>
            </h1>
            <p>
              Good food shouldn’t stop at the water’s edge.
              <br />
              Your goldfish’s new favourite takeaway, delivered.
            </p>
            <a className="primary hero-cta" href="#menu">
              Find your next feast <ArrowRight size={18} />
            </a>
            <div className="hero-proof">
              <span className="avatar">🐠</span>
              <span className="avatar second">🐟</span>
              <span className="avatar third">🐡</span>
              <div>
                <span className="stars">★★★★★</span>
                <small>Fin-approved by 2,000+ happy bowls*</small>
              </div>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="A happy goldfish swimming in an illustrated bowl"
            role="img"
          >
            <span className="art-label">100% GOOD MOOD FOOD</span>
            <div className="bubble b1" />
            <div className="bubble b2" />
            <div className="bubble b3" />
            <div className="fishbowl">
              <div className="water" />
              <div className="fish-tail" />
              <div className="goldfish">
                <div className="fin" />
                <div className="eye" />
                <div className="cheek" />
                <div className="smile" />
              </div>
              <div className="plant p1">〰</div>
              <div className="plant p2">〰</div>
              <div className="gravel" />
            </div>
            <div className="floating-rating">
              <span>✦</span>
              <div>
                Oh my cod.<small>That’s delicious.</small>
              </div>
            </div>
            <span className="art-spark s1">✧</span>
            <span className="art-spark s2">✧</span>
            <span className="art-caption">
              a feast worth a little fish dance
            </span>
          </div>
        </section>
        <section className="service-bar" id="how-it-works">
          <span>
            <MapPin /> Delivering to <strong>{region}</strong>
          </span>
          <span>
            <Clock3 />
            <strong>15–25 min</strong> to your bowl
          </span>
          <span>
            <Leaf /> Small portions. <strong>Big happiness.</strong>
          </span>
        </section>
        {delivery}
        <div className="shop-layout">
          <section id="menu" className="menu">
            <div className="section-heading">
              <div>
                <span className="eyebrow">THE GOOD STUFF</span>
                <h2>What’s your fish craving?</h2>
              </div>
              <span className="menu-note">
                Freshly imagined. Finely served.
              </span>
            </div>
            <label className="search">
              <Search size={19} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find something fin-tastic…"
                aria-label="Search dishes"
              />
            </label>
            <div className="categories" aria-label="Menu categories">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={category === c ? "active" : ""}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="dish-grid">
              {dishes.map((d) => (
                <article className="dish" key={d.id}>
                  <div className={`dish-art ${d.color}`}>
                    <span className="dish-tag">{d.tag}</span>
                    <div className="plate">
                      <span aria-hidden="true">{d.emoji}</span>
                    </div>
                    <span className="dish-spark">✧</span>
                  </div>
                  <div className="dish-body">
                    <span className="dish-detail">{d.detail}</span>
                    <h3>
                      <Link href={`/menu/${d.id}`}>{d.name} ↗</Link>
                    </h3>
                    <p>{d.description}</p>
                    <div className="dish-bottom">
                      <strong>{money(d.price)}</strong>
                      <button
                        disabled={(cart[d.id] || 0) >= 20}
                        onClick={() => change(d.id, 1)}
                        aria-label={`Add ${d.name} to your bowl`}
                      >
                        <Plus size={17} /> Add
                        {cart[d.id] ? ` (${cart[d.id]})` : ""}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!dishes.length && (
              <div className="no-results">
                <Fish />
                <h3>No fishy matches.</h3>
                <p>Try another search or explore all our dishes.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("All dishes");
                  }}
                >
                  Show all dishes
                </button>
              </div>
            )}
          </section>
          <aside id="basket" className="basket">
            <div className="basket-heading">
              <h2>Your bowl</h2>
              <ShoppingBag size={23} />
            </div>
            <span className="basket-caption">
              A little happiness is on the menu.
            </span>
            {count ? (
              <>
                <div className="cart-items">
                  {menu
                    .filter((d) => cart[d.id])
                    .map((d) => (
                      <div className="cart-item" key={d.id}>
                        <span className={`cart-emoji ${d.color}`}>
                          {d.emoji}
                        </span>
                        <div>
                          <strong>{d.name}</strong>
                          <small>{money(d.price * cart[d.id])}</small>
                          <div className="quantity">
                            <button
                              onClick={() => change(d.id, -1)}
                              aria-label={`Remove one ${d.name}`}
                            >
                              <Minus size={12} />
                            </button>
                            <span>{cart[d.id]}</span>
                            <button
                              disabled={cart[d.id] >= 20}
                              onClick={() => change(d.id, 1)}
                              aria-label={`Add one ${d.name}`}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="totals">
                  <div>
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <div>
                    <span>Reef delivery</span>
                    <span>{money(deliveryFee)}</span>
                  </div>
                  <div className="total">
                    <strong>Total</strong>
                    <strong>{money(subtotal + deliveryFee)}</strong>
                  </div>
                </div>
                {!checkout ? (
                  <button
                    className="primary checkout-button"
                    onClick={() => {
                      setCheckout(true);
                    }}
                  >
                    Go to checkout <ArrowRight size={17} />
                  </button>
                ) : (
                  <form onSubmit={order} className="checkout-form">
                    <div className="form-heading">
                      <h3>Where’s your bowl?</h3>
                      <button
                        type="button"
                        aria-label="Close checkout"
                        onClick={() => setCheckout(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <label>
                      Your fish’s name
                      <input
                        name="name"
                        required
                        maxLength={80}
                        placeholder="e.g. Sir Bubbles"
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      Bowl address
                      <input
                        name="address"
                        required
                        maxLength={160}
                        placeholder="e.g. 12 Coral Crescent"
                        autoComplete="off"
                      />
                    </label>
                    <p>Make-believe details only. No payment required.</p>
                    {error && (
                      <p role="alert" className="error">
                        {error}
                      </p>
                    )}
                    <button className="primary checkout-button" disabled={busy}>
                      {busy
                        ? "Sending to the kitchen…"
                        : `Place pretend order · ${money(subtotal + deliveryFee)}`}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="empty-basket">
                <div className="empty-icon">
                  <ShoppingBag size={34} />
                  <span>✦</span>
                </div>
                <h3>A bowl of possibilities.</h3>
                <p>
                  Add something delicious.
                  <br />
                  We’ll take care of the swimming.
                </p>
              </div>
            )}
            <div className="basket-foot">
              <Waves size={18} />
              <span>From our reef to your bowl.</span>
            </div>
          </aside>
        </div>
        <section className="closing">
          <Fish size={36} />
          <div>
            <h2>Life’s better with a full bowl.</h2>
            <p>Thoughtfully tiny portions. Ridiculously big personalities.</p>
          </div>
          <span>Stay golden. ✦</span>
        </section>
      </main>
      <footer>
        <Link className="brand" href="/">
          fin<span className="amp">&</span>feast.
        </Link>
        <p>
          A fictional takeaway for very real appetites.
          <br />
          <small>
            Demo only · No real orders or payments · *Even the reviews are
            imaginary.
          </small>
        </p>
        <span>Made with love & a little algae.</span>
      </footer>
      <span className="sr-only" role="status" aria-live="polite">
        {count} items in your bowl
      </span>
    </>
  );
}
