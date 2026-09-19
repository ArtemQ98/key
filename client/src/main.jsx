import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Building2,
  CarFront,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
  Wrench,
  X,
  CalendarDays,
  MapPin,
  Star,
  SearchCheck,
  Camera,
  Trash2,
  Image as ImageIcon,
  UserRound,
  LogIn,
  ArrowLeft,
  CheckCircle,
  Clock3,
  CreditCard,
  SlidersHorizontal,
  Globe2,
} from "lucide-react";
import "./styles.css";

const API = import.meta.env.DEV ? "http://localhost:8080/api" : "/api";
const money = (v) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
const num = (v) => new Intl.NumberFormat("ru-RU").format(Number(v || 0));

async function api(path, options = {}) {
  const token = localStorage.getItem("key_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (res.status === 401) {
    localStorage.removeItem("key_token");
    window.dispatchEvent(new Event("key:logout"));
  }
  if (!res.ok) throw new Error(data?.error || "Не удалось выполнить запрос");
  return data;
}

async function uploadPhoto(carId, file) {
  const token = localStorage.getItem("key_token");
  const form = new FormData();
  form.append("photo", file);
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/car-photos/${carId}`, {
    method: "POST",
    headers,
    body: form,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw new Error(data?.error || "Не удалось загрузить фото");
  return data;
}

const nav = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "cars", label: "Автопарк", icon: CarFront },
  { id: "rentals", label: "Аренды", icon: ClipboardCheck },
  { id: "clients", label: "Клиенты", icon: Users },
  { id: "security", label: "Проверки", icon: ShieldCheck },
  { id: "storefront", label: "Витрина", icon: Globe2 },
  { id: "finance", label: "Финансы", icon: CircleDollarSign },
  { id: "settings", label: "Настройки", icon: Settings },
];

function Logo() {
  return (
    <div className="logo">
      <span>KEY</span>
      <i />
    </div>
  );
}
function Status({ children, tone = "neutral" }) {
  return <span className={`status ${tone}`}>{children}</span>;
}
function IconButton({ children, onClick, label }) {
  return (
    <button className="icon-btn" onClick={onClick} title={label}>
      {children}
    </button>
  );
}

function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body =
        mode === "login"
          ? { identifier, password }
          : { name, phone, email, password, company_name: company };
      const data = await api(
        mode === "login" ? "/auth/login" : "/auth/register",
        { method: "POST", body: JSON.stringify(body) },
      );
      localStorage.setItem("key_token", data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="auth">
      <div className="auth-orb orb-a" />
      <div className="auth-orb orb-b" />
      <section className="auth-side">
        <Logo />
        <div className="auth-side-copy">
          <span className="kicker">Операционная система автопарка</span>
          <h1>
            Всё, что нужно, чтобы <em>зарабатывать</em> на машинах.
          </h1>
          <p>
            Аренды, автомобили, клиенты и проверки — в одном рабочем
            пространстве.
          </p>
          <div className="proof-row">
            <span>
              <Check size={15} /> без Excel
            </span>
            <span>
              <Check size={15} /> без хаоса
            </span>
            <span>
              <Check size={15} /> с контролем
            </span>
          </div>
        </div>
        <div className="auth-footer-note">KEY · fleet OS</div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="mobile-logo">
            <Logo />
          </div>
          <span className="kicker">
            {mode === "login" ? "Вход в KEY" : "Новый аккаунт"}
          </span>
          <h2>
            {mode === "login" ? "С возвращением." : "Запустим ваш автопарк."}
          </h2>
          <p className="muted">
            {mode === "login"
              ? "Войдите по телефону или email."
              : "Телефон — основной идентификатор. Email можно добавить позже."}
          </p>
          <form onSubmit={submit} className="form">
            {mode === "register" && (
              <>
                <Field label="Ваше имя">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Алексей"
                    required
                  />
                </Field>
                <Field label="Телефон">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 999 123-45-67"
                    required
                  />
                </Field>
                <Field label="Email · необязательно">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.ru"
                  />
                </Field>
                <Field label="Название автопарка · необязательно">
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="KEY Fleet"
                  />
                </Field>
              </>
            )}
            {mode === "login" && (
              <Field label="Телефон или email">
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="+7 999 123-45-67 / you@company.ru"
                  required
                  autoFocus
                />
              </Field>
            )}
            <Field label="Пароль">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                required
                minLength={8}
              />
            </Field>
            {error && (
              <div className="form-error">
                <X size={16} />
                {error}
              </div>
            )}
            <button className="btn primary wide" disabled={loading}>
              {loading
                ? "Подождите…"
                : mode === "login"
                  ? "Войти в KEY"
                  : "Создать аккаунт"}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <button
            className="text-link"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Создать аккаунт" : "Уже есть аккаунт → войти"}
          </button>
          {mode === "login" && (
            <div className="demo-box">
              <span>Демо-доступ</span>
              <b>+7 999 000-00-00</b>
              <small>пароль: password</small>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Shell({ user, active, setActive, onLogout, children, alerts }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="shell">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="side-top">
          <Logo />
          <IconButton label="Закрыть" onClick={() => setMobileOpen(false)}>
            <X size={19} />
          </IconButton>
        </div>
        <div className="workspace">
          <div className="workspace-avatar">
            {(user.name || "В").slice(0, 1)}
          </div>
          <div>
            <b>{user.company_name || "Мой автопарк"}</b>
            <small>{user.city || "Россия"} · владелец</small>
          </div>
          <ChevronRight size={15} />
        </div>
        <nav>
          {nav.map((item) => {
            const I = item.icon;
            return (
              <button
                key={item.id}
                className={active === item.id ? "active" : ""}
                onClick={() => {
                  setActive(item.id);
                  setMobileOpen(false);
                }}
              >
                <I size={18} />
                <span>{item.label}</span>
                {item.id === "security" && alerts > 0 ? (
                  <i className="nav-dot">{alerts}</i>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="side-bottom">
          <div className="security-card">
            <div className="security-icon">
              <ShieldCheck size={17} />
            </div>
            <div>
              <b>Контур безопасности</b>
              <span>Пред-проверка включена</span>
            </div>
          </div>
          <button className="logout" onClick={onLogout}>
            <LogOut size={17} />
            Выйти
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}
      <section className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="crumb">
            KEY <span>/</span> {nav.find((n) => n.id === active)?.label}
          </div>
          <div className="top-actions">
            <div className="notif">
              <Bell size={18} />
              {alerts > 0 && <i>{alerts}</i>}
            </div>
            <div className="top-avatar">{(user.name || "В").slice(0, 1)}</div>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}

function PageHead({ eyebrow, title, desc, action }) {
  return (
    <div className="page-head">
      <div>
        <span className="kicker">{eyebrow}</span>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {action}
    </div>
  );
}
function Metric({ icon: Icon, label, value, trend, sub }) {
  return (
    <div className="metric">
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">
          <Icon size={17} />
        </span>
      </div>
      <strong>{value}</strong>
      {trend && (
        <div className="metric-trend">
          <ArrowUpRight size={14} />
          {trend}
        </div>
      )}
      {sub && <small>{sub}</small>}
    </div>
  );
}

function Overview({ user, setActive }) {
  const [d, setD] = useState(null),
    [rentals, setRentals] = useState([]),
    [cars, setCars] = useState([]),
    [notes, setNotes] = useState([]),
    [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try {
      const [dd, rr, cc, nn] = await Promise.all([
        api("/dashboard"),
        api("/rentals"),
        api("/cars"),
        api("/notifications"),
      ]);
      setD(dd);
      setRentals(rr);
      setCars(cc);
      setNotes(nn);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const recent = rentals.slice(0, 5);
  return (
    <div className="page">
      <PageHead
        eyebrow="Понедельник · 13 сентября"
        title={`Добрый день, ${(user.name || "Алексей").split(" ")[0]}.`}
        desc="Вот что происходит с вашим бизнесом сегодня."
        action={
          <button className="btn primary" onClick={() => setActive("cars")}>
            <Plus size={17} />
            Добавить авто
          </button>
        }
      />
      {notes.length > 0 && (
        <div className="alert-strip">
          {notes.map((n, i) => (
            <div key={i}>
              <div className="alert-symbol">
                <Bell size={15} />
              </div>
              <div>
                <b>{n.title}</b>
                <span>{n.text}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="metrics">
        <Metric
          icon={ClipboardCheck}
          label="Сделки"
          value={loading ? "—" : num(rentals.length)}
          sub={`${rentals.filter((r) => ["pending", "confirmed", "active"].includes(r.status)).length} сейчас в работе`}
        />
        <Metric
          icon={CarFront}
          label="Автомобили"
          value={loading ? "—" : num(d?.fleet)}
          sub={`${d?.rented || 0} в аренде · ${d?.available || 0} свободно`}
        />
        <Metric
          icon={Gauge}
          label="Загрузка"
          value={loading ? "—" : `${d?.utilization || 0}%`}
          trend={
            d?.utilization >= 70
              ? "парк работает эффективно"
              : "есть резерв по загрузке"
          }
        />
        <Metric
          icon={ShieldCheck}
          label="Проверки"
          value={loading ? "—" : num(d?.verificationQueue)}
          sub="требуют внимания"
        />
      </div>
      <div className="dashboard-grid">
        <section className="card large">
          <div className="card-head">
            <div>
              <span className="kicker">Операции</span>
              <h3>Последние сделки</h3>
            </div>
            <button className="ghost-btn" onClick={() => setActive("rentals")}>
              Все аренды <ChevronRight size={15} />
            </button>
          </div>
          <RentalTable rentals={recent} compact />
        </section>
        <section className="card">
          <div className="card-head">
            <div>
              <span className="kicker">Контроль</span>
              <h3>Что важно</h3>
            </div>
          </div>
          <div className="todo-list">
            <Todo
              icon={ShieldCheck}
              title="Проверка клиента"
              text={`${d?.verificationQueue || 0} в очереди`}
              onClick={() => setActive("security")}
              done={!d?.verificationQueue}
            />
            <Todo
              icon={ClipboardCheck}
              title="Заявки"
              text={`${d?.applications || 0} требуют решения`}
              onClick={() => setActive("rentals")}
              done={!d?.applications}
            />
            <Todo
              icon={Wrench}
              title="Сервис"
              text={`${d?.maintenance || 0} авто на обслуживании`}
              onClick={() => setActive("cars")}
              done={!d?.maintenance}
            />
          </div>
        </section>
        <section className="card large">
          <div className="card-head">
            <div>
              <span className="kicker">Операции</span>
              <h3>Последние аренды</h3>
            </div>
            <button className="ghost-btn" onClick={() => setActive("rentals")}>
              Все аренды <ChevronRight size={15} />
            </button>
          </div>
          <RentalTable rentals={recent} compact />
        </section>
        <section className="card">
          <div className="card-head">
            <div>
              <span className="kicker">Автопарк</span>
              <h3>Состояние машин</h3>
            </div>
            <button className="ghost-btn" onClick={() => setActive("cars")}>
              Открыть <ChevronRight size={15} />
            </button>
          </div>
          <div className="fleet-mini">
            {cars.slice(0, 5).map((c) => (
              <div key={c.id}>
                <span className={`car-status-dot ${c.status}`} />
                <div>
                  <b>
                    {c.brand} {c.model}
                  </b>
                  <small>
                    {c.plate} · {money(c.daily_price)}/день
                  </small>
                </div>
                <span>
                  {c.status === "rented"
                    ? "В аренде"
                    : c.status === "maintenance"
                      ? "Сервис"
                      : "Свободен"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
function Todo({ icon: Icon, title, text, onClick, done }) {
  return (
    <button className="todo" onClick={onClick}>
      <span className={`todo-icon ${done ? "done" : ""}`}>
        {done ? <Check size={16} /> : <Icon size={16} />}
      </span>
      <div>
        <b>{title}</b>
        <small>{done ? "Всё чисто" : text}</small>
      </div>
      <ChevronRight size={15} />
    </button>
  );
}

function RentalTable({ rentals, compact = false, onStatus }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Клиент</th>
            <th>Автомобиль</th>
            <th>Статус</th>
            <th>Сумма</th>
            {onStatus && <th />}
          </tr>
        </thead>
        <tbody>
          {rentals.length ? (
            rentals.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="person">
                    <span>{(r.client || "К").slice(0, 1)}</span>
                    <div>
                      <b>{r.client}</b>
                      <small>{r.phone || "Телефон не указан"}</small>
                    </div>
                  </div>
                </td>
                <td>{r.car}</td>
                <td>
                  <Status tone={r.status}>
                    {{
                      hold: "Удержание",
                      pending: "Новая",
                      review: "На проверке",
                      confirmed: "Подтверждена",
                      active: "Активна",
                      completed: "Завершена",
                      cancelled: "Отменена",
                      expired: "Истекла",
                      rejected: "Отклонена",
                    }[r.status] || r.status}
                  </Status>
                </td>
                <td>
                  <b>{money(r.amount)}</b>
                </td>
                {onStatus && (
                  <td>
                    <select
                      value={r.status}
                      onChange={(e) => onStatus(r.id, e.target.value)}
                    >
                      <option value="pending">Новая</option>
                      <option value="review">На проверке</option>
                      <option value="confirmed">Подтверждена</option>
                      <option value="active">Активна</option>
                      <option value="completed">Завершена</option>
                      <option value="cancelled">Отменена</option>
                    </select>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">
                <div className="empty">Здесь пока нет аренд</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
function Cars({ onReload }) {
  const [cars, setCars] = useState([]),
    [show, setShow] = useState(false),
    [saving, setSaving] = useState(false),
    [financeCar, setFinanceCar] = useState(null),
    [photoCar, setPhotoCar] = useState(null),
    [photos, setPhotos] = useState([]),
    [photoBusy, setPhotoBusy] = useState(false),
    [form, setForm] = useState({
      brand: "",
      model: "",
      plate: "",
      year: 2024,
      daily_price: 4500,
      location: "Санкт-Петербург",
      engine_volume: "", horsepower: 0, drive_type: "", fuel_consumption: "", tank_volume: "", maintenance_interval: 10000,
    });
  async function load() {
    setCars(await api("/cars"));
  }
  useEffect(() => {
    load();
  }, []);
  async function add(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const car = await api("/cars", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          year: Number(form.year),
          daily_price: Number(form.daily_price),
        }),
      });
      setShow(false);
      setForm({
        brand: "",
        model: "",
        plate: "",
        year: 2024,
        daily_price: 4500,
        location: "Санкт-Петербург",
      });
      await load();
      setPhotoCar(car);
      setPhotos([]);
      onReload?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function status(id, status) {
    await api(`/cars/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    load();
    onReload?.();
  }
  async function remove(id) {
    if (confirm("Удалить автомобиль?")) {
      await api(`/cars/${id}`, { method: "DELETE" });
      load();
      onReload?.();
    }
  }
  async function openPhotos(car) {
    setPhotoCar(car);
    setPhotos([]);
    try {
      setPhotos(await api(`/car-photos/${car.id}`));
    } catch (e) {
      alert(e.message);
    }
  }
  async function addPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !photoCar) return;
    setPhotoBusy(true);
    try {
      await uploadPhoto(photoCar.id, file);
      setPhotos(await api(`/car-photos/${photoCar.id}`));
      await load();
      onReload?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setPhotoBusy(false);
    }
  }
  async function deletePhoto(id) {
    if (!confirm("Удалить фото?")) return;
    try {
      await api(`/car-photos/${photoCar.id}?photo_id=${id}`, {
        method: "DELETE",
      });
      setPhotos(await api(`/car-photos/${photoCar.id}`));
      await load();
      onReload?.();
    } catch (e) {
      alert(e.message);
    }
  }
  return (
    <div className="page">
      <PageHead
        eyebrow="Автопарк"
        title="Машины"
        desc="Состояние, тарифы, фото и готовность каждого автомобиля."
        action={
          <button className="btn primary" onClick={() => setShow(true)}>
            <Plus size={17} />
            Добавить авто
          </button>
        }
      />
      <div className="car-grid">
        {cars.map((c) => (
          <div className="car-card" key={c.id}>
            <div className="car-visual" onClick={() => openPhotos(c)}>
              <div className="car-visual-top">
                <span>{c.brand}</span>
                <Status tone={c.status}>
                  {c.status === "rented"
                    ? "В аренде"
                    : c.status === "maintenance"
                      ? "Сервис"
                      : "Свободен"}
                </Status>
              </div>
              {c.image_url ? (
                <img
                  className="car-card-photo"
                  src={c.image_url}
                  alt={`${c.brand} ${c.model}`}
                />
              ) : (
                <CarFront size={76} strokeWidth={1.1} />
              )}
              <span className="plate">{c.plate}</span>
              <span className="photo-hint">
                <Camera size={14} /> Фото
              </span>
            </div>
            <div className="car-info">
              <div>
                <h3>
                  {c.brand} {c.model}
                </h3>
                <span>
                  {c.year} · {num(c.mileage)} км · {c.location}
                </span>
                <div className="market-specs">
                  <span>{c.fuel || "—"}</span>
                  <span>{c.transmission || "—"}</span>
                  <span>{c.seats || "—"} мест</span>
                </div>
              </div>
              <div className="price">
                {money(c.daily_price)}
                <small>/сутки</small>
              </div>
            </div>
            <div className="car-finance-mini">
              <div>
                <span>Заработано</span>
                <b>{money(c.earnings)}</b>
              </div>
              <div>
                <span>Расходы</span>
                <b>{money(c.expenses)}</b>
              </div>
              <button className="finance-btn" onClick={() => setFinanceCar(c)}>
                Финансы
              </button>
            </div>
            <div className="car-actions">
              <button className="photo-btn" onClick={() => openPhotos(c)}>
                <Camera size={16} /> Фото
              </button>
              <button className="photo-btn" onClick={() => setFinanceCar(c)}>
                <CircleDollarSign size={16} /> Финансы
              </button>
              <select
                value={c.status}
                onChange={(e) => status(c.id, e.target.value)}
              >
                <option value="available">Свободен</option>
                <option value="rented">В аренде</option>
                <option value="maintenance">Сервис</option>
              </select>
              <IconButton label="Удалить" onClick={() => remove(c.id)}>
                <X size={17} />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
      {!cars.length && (
        <Empty
          icon={CarFront}
          title="Добавьте первый автомобиль"
          text="После этого KEY начнёт считать загрузку, выручку и доступность."
          action={() => setShow(true)}
        />
      )}
      {show && (
        <Modal title="Новый автомобиль" close={() => setShow(false)}>
          <form className="modal-form" onSubmit={add}>
            <div className="two">
              <Field label="Марка">
                <input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Kia"
                  required
                />
              </Field>
              <Field label="Модель">
                <input
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="K5"
                  required
                />
              </Field>
            </div>
            <div className="two">
              <Field label="Госномер">
                <input
                  value={form.plate}
                  onChange={(e) => setForm({ ...form, plate: e.target.value })}
                  placeholder="А123АА198"
                  required
                />
              </Field>
              <Field label="Год">
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  required
                />
              </Field>
            </div>
            <div className="two">
              <Field label="Двигатель">
                <input value={form.engine_volume} onChange={(e)=>setForm({...form, engine_volume:e.target.value})} placeholder="2.5 л" />
              </Field>
              <Field label="Мощность л.с.">
                <input type="number" value={form.horsepower} onChange={(e)=>setForm({...form, horsepower:Number(e.target.value)})} placeholder="180" />
              </Field>
            </div>
            <div className="two">
              <Field label="Коробка">
                <input value={form.transmission || ""} onChange={(e)=>setForm({...form, transmission:e.target.value})} placeholder="АКПП" />
              </Field>
              <Field label="Привод">
                <input value={form.drive_type} onChange={(e)=>setForm({...form, drive_type:e.target.value})} placeholder="Передний" />
              </Field>
            </div>
            <div className="two">
              <Field label="Расход топлива">
                <input value={form.fuel_consumption} onChange={(e)=>setForm({...form, fuel_consumption:e.target.value})} placeholder="8 л/100 км" />
              </Field>
              <Field label="Объём бака">
                <input value={form.tank_volume} onChange={(e)=>setForm({...form, tank_volume:e.target.value})} placeholder="60 л" />
              </Field>
            </div>
            <div className="two">
              <Field label="Цена / сутки">
                <input
                  type="number"
                  value={form.daily_price}
                  onChange={(e) =>
                    setForm({ ...form, daily_price: e.target.value })
                  }
                />
              </Field>
              <Field label="Город">
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />
              </Field>
            </div>
            <button className="btn primary wide" disabled={saving}>
              {saving ? "Сохраняем…" : "Добавить автомобиль"}
              <ArrowUpRight size={17} />
            </button>
          </form>
        </Modal>
      )}
      {photoCar && (
        <CarPhotosModal
          car={photoCar}
          photos={photos}
          busy={photoBusy}
          onUpload={addPhoto}
          onDelete={deletePhoto}
          close={() => setPhotoCar(null)}
        />
      )}
      {financeCar && (
        <CarFinanceModal
          car={financeCar}
          onClose={() => setFinanceCar(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
function CarFinanceModal({ car, onClose, onSaved }) {
  const [data, setData] = useState(null),
    [busy, setBusy] = useState(false),
    [form, setForm] = useState({ amount: "", category: "", note: "" });
  async function load() {
    try {
      setData(await api(`/car-finance/${car.id}`));
    } catch (e) {
      alert(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [car.id]);
  async function add(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    setBusy(true);
    try {
      await api(`/car-finance/${car.id}`, {
        method: "POST",
        body: JSON.stringify({
          amount: Number(form.amount),
          category: form.category,
          note: form.note,
        }),
      });
      setForm({ amount: "", category: "", note: "" });
      await load();
      await onSaved?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    if (!confirm("Удалить расход?")) return;
    try {
      await api(`/car-finance/${car.id}?expense_id=${id}`, {
        method: "DELETE",
      });
      load();
      onSaved?.();
    } catch (e) {
      alert(e.message);
    }
  }
  return (
    <div className="modal-backdrop">
      <div className="finance-modal">
        <div className="finance-head">
          <div>
            <span className="kicker">Финансы автомобиля</span>
            <h2>
              {car.brand} {car.model}
            </h2>
            <p>{car.plate} · только основные цифры</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="finance-summary">
          <div>
            <span>Заработано со сделок</span>
            <b>{money(data?.earnings || 0)}</b>
          </div>
          <div>
            <span>Расходы на машину</span>
            <b>{money(data?.expenses_total || 0)}</b>
          </div>
          <div>
            <span>Итого</span>
            <b>
              {money(
                Number(data?.earnings || 0) - Number(data?.expenses_total || 0),
              )}
            </b>
          </div>
        </div>
        <form className="finance-add" onSubmit={add}>
          <Field label="Сумма">
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="5 000"
              required
            />
          </Field>
          <Field label="На что потратил">
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Бензин, запчасти, мойка"
            />
          </Field>
          <Field label="Комментарий">
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Необязательно"
            />
          </Field>
          <button className="btn primary" disabled={busy}>
            {busy ? "Сохраняем…" : "Добавить расход"}
            <Plus size={16} />
          </button>
        </form>
        <div className="finance-list">
          <div className="finance-list-head">
            <h3>Расходы</h3>
            <span>{data?.expenses?.length || 0}</span>
          </div>
          {data?.expenses?.length ? (
            data.expenses.map((x) => (
              <div className="finance-row" key={x.id}>
                <div>
                  <b>{x.category || "Расход"}</b>
                  <small>
                    {x.note || "Без комментария"} ·{" "}
                    {new Date(x.created_at).toLocaleDateString("ru-RU")}
                  </small>
                </div>
                <strong>{money(x.amount)}</strong>
                <button
                  className="mini-btn"
                  onClick={() => remove(x.id)}
                  title="Удалить"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          ) : (
            <p className="muted">Расходов пока нет.</p>
          )}
        </div>
        <div className="finance-deals">
          <div className="finance-list-head">
            <h3>Сделки</h3>
            <span>{data?.deals?.length || 0}</span>
          </div>
          {data?.deals?.length ? (
            data.deals.map((x) => (
              <div className="finance-row" key={x.id}>
                <div>
                  <b>{x.client || "Сделка"}</b>
                  <small>
                    {x.code || ""} ·{" "}
                    {x.starts_at
                      ? new Date(x.starts_at).toLocaleDateString("ru-RU")
                      : ""}
                  </small>
                </div>
                <strong>{money(x.amount)}</strong>
              </div>
            ))
          ) : (
            <p className="muted">Сделок пока нет.</p>
          )}
        </div>
      </div>
    </div>
  );
}
function CarPhotosModal({ car, photos, busy, onUpload, onDelete, close }) {
  return (
    <div className="modal-backdrop">
      <div className="photo-modal">
        <div className="photo-modal-head">
          <div>
            <span className="kicker">Галерея автомобиля</span>
            <h2>
              {car.brand} {car.model}
            </h2>
            <p>JPG, PNG или WebP · до 10 МБ за фото</p>
          </div>
          <button className="icon-btn" onClick={close}>
            <X size={20} />
          </button>
        </div>
        <div className="photo-grid">
          {photos.map((p) => (
            <div className="photo-item" key={p.id}>
              <img src={p.url} alt="" />
              <button
                className="photo-delete"
                onClick={() => onDelete(p.id)}
                title="Удалить"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!photos.length && (
            <div className="photo-empty">
              <ImageIcon size={34} />
              <b>Фотографий пока нет</b>
              <span>
                Добавьте первое фото — оно станет главным и будет видно
                клиентам.
              </span>
            </div>
          )}
        </div>
        <label className="photo-upload">
          <Camera size={20} />
          <span>
            {busy ? "Загружаем…" : "Добавить фотографию"}
            <small>До 10 МБ · JPG, PNG, WebP</small>
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onUpload}
            disabled={busy}
          />
        </label>
      </div>
    </div>
  );
}

function Rentals() {
  const [rentals, setRentals] = useState([]),
    [calendar, setCalendar] = useState(null),
    [selected, setSelected] = useState(null),
    [loading, setLoading] = useState(true),
    [filter, setFilter] = useState("all"),
    [range, setRange] = useState(30),
    [error, setError] = useState("");
  const [show, setShow] = useState(false),
    [form, setForm] = useState({
      car_id: 0,
      client_name: "",
      client_phone: "",
      amount: 0,
      starts_at: "",
      ends_at: "",
    });
  const [cars, setCars] = useState([]);
  const today = dateOnly(new Date()),
    endDate = dateOnly(new Date(Date.now() + range * 86400000));
  async function load() {
    setLoading(true);
    setError("");
    try {
      const [rr, cc] = await Promise.all([
        api("/rentals"),
        api(`/rentals/calendar?from=${today}&to=${endDate}`),
      ]);
      setRentals(rr);
      setCalendar(cc);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    api("/cars").then(setCars).catch(() => {});
  }, [range]);
  async function status(id, status) {
    try {
      await api(`/rentals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
      if (selected?.id === id) setSelected(await api(`/rental-ops/${id}`));
    } catch (e) {
      alert(e.message);
    }
  }
  async function openRental(id) {
    try {
      setSelected(await api(`/rental-ops/${id}`));
    } catch (e) {
      alert(e.message);
    }
  }
  async function add(e) {
    e.preventDefault();
    if (!form.car_id) {
      alert("Выберите автомобиль");
      return;
    }
    try {
      await api("/rentals", {
        method: "POST",
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      setShow(false);
      setForm({
        car_id: 0,
        client_name: "",
        client_phone: "",
        amount: 0,
        starts_at: "",
        ends_at: "",
      });
      load();
    } catch (e) {
      alert(e.message);
    }
  }
  const visible = rentals.filter(
    (r) => filter === "all" || r.status === filter,
  );
  const statusLabel = {
    hold: "Удержание",
    pending: "Новая",
    review: "Проверка",
    confirmed: "Подтверждена",
    preparing: "Готовится",
    active: "В аренде",
    returned: "Возвращена",
    completed: "Завершена",
    cancelled: "Отменена",
    expired: "Истекла",
    rejected: "Отклонена",
  };
  const next = {
    confirmed: "preparing",
    preparing: "active",
    active: "returned",
    returned: "completed",
  };
  return (
    <div className="page">
      <PageHead
        eyebrow="Rental Core · v0.7"
        title="Аренды"
        desc="Полный жизненный цикл сделки: бронь → подготовка → выдача → возврат → деньги."
        action={
          <div className="head-actions">
            <button className="btn ghost-btn" onClick={load}>
              <CalendarDays size={17} />
              Обновить
            </button>
            <button className="btn primary" onClick={() => setShow(true)}>
              <Plus size={17} />
              Новая аренда
            </button>
          </div>
        }
      />
      {error && <div className="market-error">{error}</div>}
      <div className="rental-kpis">
        <div>
          <CalendarDays size={18} />
          <span>В работе</span>
          <b>
            {
              rentals.filter((r) =>
                ["confirmed", "preparing", "active"].includes(r.status),
              ).length
            }
          </b>
        </div>
        <div>
          <Clock3 size={18} />
          <span>Ожидают решения</span>
          <b>
            {
              rentals.filter((r) => ["pending", "review"].includes(r.status))
                .length
            }
          </b>
        </div>
        <div>
          <Wallet size={18} />
          <span>Выручка</span>
          <b>
            {money(
              rentals
                .filter((r) =>
                  ["active", "returned", "completed"].includes(r.status),
                )
                .reduce(
                  (a, r) => a + Number(r.final_total || r.amount || 0),
                  0,
                ),
            )}
          </b>
        </div>
        <div>
          <CircleDollarSign size={18} />
          <span>Депозиты</span>
          <b>
            {money(
              rentals
                .filter(
                  (r) =>
                    !["cancelled", "rejected", "expired"].includes(r.status),
                )
                .reduce((a, r) => a + Number(r.deposit || 0), 0),
            )}
          </b>
        </div>
      </div>
      <section className="card rental-calendar-card">
        <div className="card-head">
          <div>
            <span className="kicker">Планирование</span>
            <h3>Календарь автопарка</h3>
          </div>
          <div className="range-tabs">
            <button
              className={range === 14 ? "active" : ""}
              onClick={() => setRange(14)}
            >
              14 дней
            </button>
            <button
              className={range === 30 ? "active" : ""}
              onClick={() => setRange(30)}
            >
              30 дней
            </button>
          </div>
        </div>
        {loading ? (
          <div className="calendar-loading">Загружаем календарь…</div>
        ) : (
          <div className="fleet-calendar">
            {calendar?.cars?.map((c) => (
              <div className="calendar-car" key={c.id}>
                <div className="calendar-car-name">
                  <span className={`car-status-dot ${c.status}`} />
                  <div>
                    <b>{c.car}</b>
                    <small>
                      {c.plate} · {money(c.daily_price)}/сут
                    </small>
                  </div>
                </div>
                <div className="calendar-track">
                  <div className="calendar-days">
                    {Array.from({ length: Math.min(range, 30) }, (_, i) => (
                      <span key={i}>
                        {new Date(Date.now() + i * 86400000).getDate()}
                      </span>
                    ))}
                  </div>
                  <div className="calendar-bookings">
                    {c.bookings?.length ? (
                      c.bookings.map((b) => (
                        <button
                          key={b.id}
                          className={`calendar-booking ${b.status}`}
                          onClick={() => openRental(b.id)}
                        >
                          <span>{b.client || b.code}</span>
                          <small>
                            {new Date(b.starts_at).toLocaleDateString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                            })}{" "}
                            →{" "}
                            {new Date(b.ends_at).toLocaleDateString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </small>
                        </button>
                      ))
                    ) : (
                      <span className="calendar-free">Свободен на период</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="card">
        <div className="card-head">
          <div>
            <span className="kicker">Сделки</span>
            <h3>Все аренды</h3>
          </div>
          <div className="filter-tabs">
            {[
              ["all", "Все"],
              ["pending", "Новые"],
              ["confirmed", "Подтверждены"],
              ["active", "В аренде"],
              ["returned", "Возврат"],
            ].map(([k, l]) => (
              <button
                key={k}
                className={filter === k ? "active" : ""}
                onClick={() => setFilter(k)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Автомобиль</th>
                <th>Период</th>
                <th>Статус</th>
                <th>Сумма</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.length ? (
                visible.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => openRental(r.id)}
                    className="click-row"
                  >
                    <td>
                      <div className="person">
                        <span>{(r.client || "К").slice(0, 1)}</span>
                        <div>
                          <b>{r.client}</b>
                          <small>{r.phone || "Телефон не указан"}</small>
                        </div>
                      </div>
                    </td>
                    <td>{r.car}</td>
                    <td>
                      {r.starts_at ? (
                        <small>
                          {new Date(r.starts_at).toLocaleDateString("ru-RU")} —{" "}
                          {new Date(r.ends_at).toLocaleDateString("ru-RU")}
                        </small>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <Status tone={r.status}>
                        {statusLabel[r.status] || r.status}
                      </Status>
                    </td>
                    <td>
                      <b>{money(r.final_total || r.amount)}</b>
                      <small className="cell-muted">
                        {r.payment_status === "paid"
                          ? "Оплачено"
                          : "Не оплачено"}
                      </small>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {next[r.status] ? (
                        <button
                          className="row-next"
                          onClick={() => status(r.id, next[r.status])}
                        >
                          {next[r.status] === "preparing"
                            ? "Подготовить"
                            : next[r.status] === "active"
                              ? "Выдать авто"
                              : next[r.status] === "returned"
                                ? "Принять возврат"
                                : "Закрыть"}
                          <ChevronRight size={14} />
                        </button>
                      ) : (
                        <button
                          className="icon-btn"
                          onClick={() => openRental(r.id)}
                        >
                          <ChevronRight size={17} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty">Аренд с таким статусом нет</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {show && (
        <Modal title="Новая аренда" close={() => setShow(false)}>
          <form className="modal-form" onSubmit={add}>
            <Field label="Автомобиль">
              <select
                value={form.car_id}
                onChange={(e) => setForm({ ...form, car_id: Number(e.target.value) })}
                required
              >
                <option value={0}>— выберите автомобиль —</option>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.brand} {c.model} · {c.plate} · {money(c.daily_price)}/сут
                  </option>
                ))}
              </select>
            </Field>
            <div className="two">
              <Field label="Клиент">
                <input
                  value={form.client_name}
                  onChange={(e) =>
                    setForm({ ...form, client_name: e.target.value })
                  }
                  placeholder="Андрей С."
                  required
                />
              </Field>
              <Field label="Телефон">
                <input
                  value={form.client_phone}
                  onChange={(e) =>
                    setForm({ ...form, client_phone: e.target.value })
                  }
                  placeholder="+7 999..."
                />
              </Field>
            </div>
            <div className="two">
              <Field label="Получение">
                <input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) =>
                    setForm({ ...form, starts_at: e.target.value })
                  }
                />
              </Field>
              <Field label="Возврат">
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) =>
                    setForm({ ...form, ends_at: e.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Сумма договора">
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <button className="btn primary wide">
              Создать аренду
              <ArrowUpRight size={17} />
            </button>
          </form>
        </Modal>
      )}
      {selected && (
        <RentalDetail
          rental={selected}
          close={() => setSelected(null)}
          onChanged={async () => {
            await load();
            setSelected(await api(`/rental-ops/${selected.id}`));
          }}
        />
      )}
    </div>
  );
}

function RentalDetail({ rental, close, onChanged }) {
  const [busy, setBusy] = useState(false),
    [op, setOp] = useState(null),
    [form, setForm] = useState({});
  const labels = {
    hold: "Удержание",
    pending: "Новая",
    review: "Проверка",
    confirmed: "Подтверждена",
    preparing: "Готовится",
    active: "В аренде",
    returned: "Возвращена",
    completed: "Завершена",
    cancelled: "Отменена",
    expired: "Истекла",
    rejected: "Отклонена",
  };
  const next = {
    hold: ["confirmed", "rejected"],
    pending: ["review", "confirmed", "rejected"],
    review: ["confirmed", "rejected"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["active", "cancelled"],
    active: ["returned"],
    returned: ["completed"],
  };
  async function save(type) {
    setBusy(true);
    try {
      const payload = {
        ...form,
        type,
        qty: Number(form.qty || 1),
        unit_price: Number(form.unit_price || 0),
        amount: Number(form.amount || 0),
        mileage: form.mileage ? Number(form.mileage) : null,
        fuel_level: form.fuel_level ? Number(form.fuel_level) : null,
      };
      if (type === "inspection")
        payload.kind = op === "inspection-return" ? "return" : "pickup";
      await api(`/rental-ops/${rental.id}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setOp(null);
      setForm({});
      await onChanged();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function transition(status) {
    setBusy(true);
    try {
      await api(`/rentals/${rental.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await onChanged();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function scheduleMeeting(kind) {
    setBusy(true);
    try {
      await api(`/rentals/meeting/${rental.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          kind,
          at: form.meeting_at,
          location: form.meeting_location,
        }),
      });
      setOp(null);
      setForm({});
      await onChanged();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function togglePaid() {
    setBusy(true);
    try {
      await api(`/rentals/payment/${rental.id}`, {
        method: "PATCH",
        body: JSON.stringify({ paid: rental.payment_status !== "paid" }),
      });
      await onChanged();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <div className="rental-detail">
        <div className="detail-head">
          <div>
            <span className="kicker">
              {rental.booking_code || `Аренда #${rental.id}`}
            </span>
            <h2>{rental.car}</h2>
            <p>
              {rental.client} · {rental.status && labels[rental.status]}
            </p>
          </div>
          <button className="icon-btn" onClick={close}>
            <X size={20} />
          </button>
        </div>
        <div className="detail-progress">
          <div className="detail-progress-line">
            <i
              className={
                rental.status !== "cancelled" && rental.status !== "rejected"
                  ? "on"
                  : ""
              }
            />
          </div>
          {["confirmed", "preparing", "active", "returned", "completed"].map(
            (s) => (
              <div className={rental.status === s ? "current" : ""} key={s}>
                <span>
                  {s === "confirmed"
                    ? "Бронь"
                    : s === "preparing"
                      ? "Подготовка"
                      : s === "active"
                        ? "Выдача"
                        : s === "returned"
                          ? "Возврат"
                          : "Закрытие"}
                </span>
              </div>
            ),
          )}
        </div>
        <div className="detail-grid">
          <section className="detail-main">
            <div className="detail-stats">
              <div>
                <span>Период</span>
                <b>
                  {rental.starts_at
                    ? new Date(rental.starts_at).toLocaleDateString("ru-RU")
                    : "—"}{" "}
                  —{" "}
                  {rental.ends_at
                    ? new Date(rental.ends_at).toLocaleDateString("ru-RU")
                    : "—"}
                </b>
              </div>
              <div>
                <span>Сумма</span>
                <b>{money(rental.final_total || rental.amount)}</b>
              </div>
              <div>
                <span>Депозит</span>
                <b>{money(rental.deposit)}</b>
              </div>
              <div>
                <span>Оплата</span>
                <b>
                  {rental.payment_status === "paid"
                    ? "Оплачено"
                    : "Не оплачено"}
                </b>
              </div>
              <div>
                <span>Заработано со сделки</span>
                <b>{money(rental.final_total || rental.amount)}</b>
              </div>
            </div>
            <div className="detail-actions">
              <span className="kicker">Следующий шаг</span>
              <div>
                {(next[rental.status] || []).map((s) => (
                  <button
                    key={s}
                    className={`btn ${s === "rejected" || s === "cancelled" ? "danger" : "primary"}`}
                    disabled={busy}
                    onClick={() => transition(s)}
                  >
                    {labels[s]}
                  </button>
                ))}
              </div>
            </div>
            <div className="ops-buttons">
              <button onClick={() => setOp("inspection-pickup")}>
                <ClipboardCheck size={17} />
                Осмотр при выдаче
              </button>
              <button onClick={() => setOp("inspection-return")}>
                <CheckCircle2 size={17} />
                Осмотр при возврате
              </button>
              <button onClick={() => setOp("extra")}>
                <Plus size={17} />
                Добавить услугу
              </button>
              <button onClick={() => setOp("extension")}>
                <Clock3 size={17} />
                Продлить аренду
              </button>
              <button onClick={() => setOp("meeting-pickup")}>
                <CalendarDays size={17} />
                Назначить получение
              </button>
              <button onClick={() => setOp("meeting-return")}>
                <CalendarDays size={17} />
                Назначить возврат
              </button>
              <button onClick={togglePaid} disabled={busy}>
                <Wallet size={17} />
                {rental.payment_status === "paid"
                  ? "Оплата подтверждена"
                  : "Подтвердить оплату"}
              </button>
            </div>
            <div className="detail-columns">
              <div>
                <h4>Доп. услуги</h4>
                {rental.extras?.length ? (
                  rental.extras.map((x) => (
                    <div className="line-item" key={x.id}>
                      <span>
                        {x.name} × {x.qty}
                      </span>
                      <b>{money(x.total)}</b>
                    </div>
                  ))
                ) : (
                  <p className="muted">Пока нет</p>
                )}
              </div>
              <div>
                <h4>Платежи</h4>
                {rental.payments?.length ? (
                  rental.payments.map((x) => (
                    <div className="line-item" key={x.id}>
                      <span>{x.type}</span>
                      <b>{money(x.amount)}</b>
                    </div>
                  ))
                ) : (
                  <p className="muted">Пока нет</p>
                )}
              </div>
            </div>
            <div className="detail-columns">
              <div>
                <h4>Корректировки</h4>
                {rental.adjustments?.length ? (
                  rental.adjustments.map((x) => (
                    <div className="line-item" key={x.id}>
                      <span>{x.type}</span>
                      <b>{money(x.amount)}</b>
                    </div>
                  ))
                ) : (
                  <p className="muted">Пока нет</p>
                )}
              </div>
              <div>
                <h4>Депозит</h4>
                {rental.deposit_transactions?.length ? (
                  rental.deposit_transactions.map((x) => (
                    <div className="line-item" key={x.id}>
                      <span>{x.type}</span>
                      <b>{money(x.amount)}</b>
                    </div>
                  ))
                ) : (
                  <p className="muted">Операций пока нет</p>
                )}
              </div>
            </div>
            {rental.inspections?.length > 0 && (
              <div>
                <h4>Осмотры</h4>
                {rental.inspections.map((x) => (
                  <div className="inspection-item" key={x.id}>
                    <b>{x.kind === "pickup" ? "Выдача" : "Возврат"}</b>
                    <span>
                      {x.mileage ? `${x.mileage} км · ` : ""}
                      {x.fuel_level != null ? `${x.fuel_level}% топлива` : ""}
                    </span>
                    <small>{x.notes || "Без замечаний"}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
          <aside className="detail-side">
            <div className="detail-side-head">
              <span className="kicker">История</span>
              <h3>События сделки</h3>
            </div>
            {rental.events?.map((e) => (
              <div className="event-item" key={e.id}>
                <span>
                  {new Date(e.created_at).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <b>{e.to ? `Статус: ${labels[e.to] || e.to}` : e.type}</b>
              </div>
            ))}
          </aside>
        </div>
        {op && (
          <div className="inline-op">
            <div className="inline-op-head">
              <b>
                {op === "meeting-pickup"
                  ? "Встреча: получение"
                  : op === "meeting-return"
                    ? "Встреча: возврат"
                    : op === "extra"
                      ? "Новая услуга"
                      : op === "payment"
                        ? "Новый платёж"
                        : op === "expense"
                          ? "Расход по аренде"
                          : op === "adjustment"
                            ? "Штраф или повреждение"
                            : op === "deposit"
                              ? "Операция с депозитом"
                              : op === "extension"
                                ? "Продление аренды"
                                : op === "inspection-pickup"
                                  ? "Осмотр при выдаче"
                                  : "Осмотр при возврате"}
              </b>
              <button onClick={() => setOp(null)}>
                <X size={16} />
              </button>
            </div>
            {(op === "meeting-pickup" || op === "meeting-return") && (
              <>
                <div className="two">
                  <Field label="Дата и время">
                    <input
                      type="datetime-local"
                      value={form.meeting_at || ""}
                      onChange={(e) =>
                        setForm({ ...form, meeting_at: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Место встречи">
                    <input
                      value={form.meeting_location || ""}
                      onChange={(e) =>
                        setForm({ ...form, meeting_location: e.target.value })
                      }
                      placeholder="Тула, ул. ..."
                    />
                  </Field>
                </div>
                <button
                  className="btn primary"
                  disabled={busy}
                  onClick={() =>
                    scheduleMeeting(
                      op === "meeting-pickup" ? "pickup" : "return",
                    )
                  }
                >
                  Сохранить встречу
                  <Check size={16} />
                </button>
              </>
            )}
            {op === "extra" && (
              <div className="two">
                <Field label="Услуга">
                  <input
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Детское кресло"
                  />
                </Field>
                <Field label="Цена">
                  <input
                    type="number"
                    value={form.unit_price || ""}
                    onChange={(e) =>
                      setForm({ ...form, unit_price: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}
            {op === "payment" && (
              <div className="two">
                <Field label="Сумма">
                  <input
                    type="number"
                    value={form.amount || ""}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                  />
                </Field>
                <Field label="Тип">
                  <input
                    value={form.payment_type || "rental"}
                    onChange={(e) =>
                      setForm({ ...form, payment_type: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}
            {op === "adjustment" && (
              <div className="two">
                <Field label="Тип">
                  <select
                    value={form.kind || "damage_fee"}
                    onChange={(e) => setForm({ ...form, kind: e.target.value })}
                  >
                    <option value="damage_fee">Повреждение</option>
                    <option value="late_fee">Просрочка</option>
                    <option value="other">Другое</option>
                    <option value="discount">Скидка</option>
                  </select>
                </Field>
                <Field label="Сумма">
                  <input
                    type="number"
                    value={form.amount || ""}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}
            {op === "deposit" && (
              <div className="two">
                <Field label="Операция">
                  <select
                    value={form.kind || "release"}
                    onChange={(e) => setForm({ ...form, kind: e.target.value })}
                  >
                    <option value="hold">Зарезервировать</option>
                    <option value="release">Вернуть клиенту</option>
                    <option value="charge">Удержать</option>
                  </select>
                </Field>
                <Field label="Сумма">
                  <input
                    type="number"
                    value={form.amount || ""}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}
            {op === "extension" && (
              <Field label="Новая дата и время возврата">
                <input
                  type="datetime-local"
                  value={form.new_end || ""}
                  onChange={(e) =>
                    setForm({ ...form, new_end: e.target.value })
                  }
                />
              </Field>
            )}
            {op?.startsWith("inspection") && (
              <div className="two">
                <Field label="Пробег">
                  <input
                    type="number"
                    value={form.mileage || ""}
                    onChange={(e) =>
                      setForm({ ...form, mileage: e.target.value })
                    }
                  />
                </Field>
                <Field label="Топливо %">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.fuel_level || ""}
                    onChange={(e) =>
                      setForm({ ...form, fuel_level: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}
            <Field label="Комментарий">
              <input
                value={form.note || ""}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Комментарий для истории"
              />
            </Field>
            <button
              className="btn primary"
              disabled={busy}
              onClick={() =>
                save(op.startsWith("inspection") ? "inspection" : op)
              }
            >
              {busy ? "Сохраняем…" : "Сохранить операцию"}
              <Check size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
function Clients() {
  const [clients, setClients] = useState([]);
  useEffect(() => {
    api("/clients").then(setClients);
  }, []);
  return (
    <div className="page">
      <PageHead
        eyebrow="CRM"
        title="Клиенты"
        desc="История взаимодействий и ценность клиента для автопарка."
      />
      <section className="card">
        <div className="client-list">
          {clients.map((c, i) => (
            <div className="client-row" key={i}>
              <div className="client-avatar">{c.name.slice(0, 1)}</div>
              <div className="client-main">
                <b>{c.name}</b>
                <small>{c.phone || "Телефон не указан"}</small>
              </div>
              <div>
                <span className="kicker">Аренд</span>
                <strong>{c.rentals}</strong>
              </div>
              <div>
                <span className="kicker">Выручка</span>
                <strong>{money(c.total)}</strong>
              </div>
              <div>
                <span className="kicker">Последняя</span>
                <strong>{new Date(c.last).toLocaleDateString("ru-RU")}</strong>
              </div>
              <ChevronRight size={17} />
            </div>
          ))}
          {!clients.length && (
            <Empty
              icon={Users}
              title="Клиентов пока нет"
              text="После первой заявки клиент появится здесь."
            />
          )}
        </div>
      </section>
    </div>
  );
}
function Security() {
  const [items, setItems] = useState([]),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    setItems(await api("/verification"));
  }
  useEffect(() => {
    load();
  }, []);
  async function start(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/verification", {
        method: "POST",
        body: JSON.stringify({ name, phone }),
      });
      setName("");
      setPhone("");
      load();
    } finally {
      setBusy(false);
    }
  }
  async function advance(v) {
    await api(`/verification/${v.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        stage: "Проверка документов",
        status: "approved",
        score: v.score + 8,
        progress: 100,
        risk_level: "low",
      }),
    });
    load();
  }
  return (
    <div className="page">
      <PageHead
        eyebrow="Risk & compliance"
        title="Проверки клиентов"
        desc="Контур до интеграции с внешними государственными сервисами: анкета → документы → риск → решение."
      />
      <div className="security-layout">
        <section className="card">
          <div className="card-head">
            <div>
              <span className="kicker">Новая проверка</span>
              <h3>Запустить pre-check</h3>
            </div>
            <ShieldCheck size={22} />
          </div>
          <form className="modal-form" onSubmit={start}>
            <Field label="Имя клиента">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Петров"
                required
              />
            </Field>
            <Field label="Телефон">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 999 123-45-67"
              />
            </Field>
            <button className="btn primary wide" disabled={busy}>
              {busy ? "Запускаем…" : "Запустить проверку"}
              <ArrowUpRight size={17} />
            </button>
          </form>
          <div className="precheck-steps">
            <Step n="01" title="Анкета" text="Контактные данные и согласие" />
            <Step
              n="02"
              title="Документы"
              text="Паспорт и права — подключим следующим слоем"
            />
            <Step n="03" title="Риск" text="Скоринг и ручное решение" />
            <Step
              n="04"
              title="Госуслуги"
              text="Точка интеграции — пока не подключаем"
              locked
            />
          </div>
        </section>
        <section className="card">
          <div className="card-head">
            <div>
              <span className="kicker">Очередь</span>
              <h3>Кандидаты</h3>
            </div>
            <span className="count">{items.length}</span>
          </div>
          <div className="verification-list">
            {items.map((v) => (
              <div className="verification-row" key={v.id}>
                <div className="verify-avatar">{v.score}</div>
                <div className="verify-main">
                  <b>{v.phone || "Клиент"}</b>
                  <span>{v.stage}</span>
                  <div className="progress">
                    <i style={{ width: `${v.progress}%` }} />
                  </div>
                </div>
                <div className="risk">
                  <Status tone={v.risk_level}>
                    {v.risk_level === "low"
                      ? "Низкий риск"
                      : v.risk_level === "high"
                        ? "Высокий риск"
                        : "Средний риск"}
                  </Status>
                  <small>{v.progress}%</small>
                </div>
                <button
                  className="mini-btn"
                  onClick={() => advance(v)}
                  disabled={v.progress === 100}
                >
                  {v.progress === 100 ? (
                    <Check size={15} />
                  ) : (
                    <ChevronRight size={15} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
function Step({ n, title, text, locked }) {
  return (
    <div className={`step ${locked ? "locked" : ""}`}>
      <span>{locked ? "—" : n}</span>
      <div>
        <b>{title}</b>
        <small>{text}</small>
      </div>
      {locked ? <FileText size={17} /> : <CheckCircle2 size={17} />}
    </div>
  );
}

function StorefrontPage() {
  const [profile, setProfile] = useState({
      slug: "",
      title: "",
      description: "",
      city: "Санкт-Петербург",
      published: true,
    }),
    [saving, setSaving] = useState(false),
    [cars, setCars] = useState([]);
  useEffect(() => {
    Promise.all([api("/fleet-profile"), api("/cars")]).then(([p, c]) => {
      setProfile(p);
      setCars(c);
    });
  }, []);
  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      setProfile(
        await api("/fleet-profile", {
          method: "PATCH",
          body: JSON.stringify(profile),
        }),
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function toggleCar(c) {
    await api(`/cars/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({ public_enabled: !c.public_enabled }),
    });
    setCars(await api("/cars"));
  }
  return (
    <div className="page">
      <PageHead
        eyebrow="Marketplace"
        title="Витрина автопарка"
        desc="Управляйте тем, как ваш парк выглядит в публичном каталоге KEY."
        action={
          <button
            className="btn primary"
            onClick={() => window.open("/", "_blank")}
          >
            <Globe2 size={17} />
            Открыть каталог
          </button>
        }
      />
      <div className="settings-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <span className="kicker">Публичная страница</span>
              <h3>Ваш автопарк</h3>
            </div>
            <Globe2 size={20} />
          </div>
          <form className="modal-form" onSubmit={save}>
            <Field label="Название">
              <input
                value={profile.title || ""}
                onChange={(e) =>
                  setProfile({ ...profile, title: e.target.value })
                }
                placeholder="KEY Fleet"
                required
              />
            </Field>
            <Field label="Slug">
              <input
                value={profile.slug || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, ""),
                  })
                }
                placeholder="key-fleet"
                required
              />
            </Field>
            <Field label="Описание">
              <textarea
                className="textarea"
                value={profile.description || ""}
                onChange={(e) =>
                  setProfile({ ...profile, description: e.target.value })
                }
                placeholder="Коротко о вашем автопарке"
              />
            </Field>
            <Field label="Город">
              <input
                value={profile.city || ""}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
              />
            </Field>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={!!profile.published}
                onChange={(e) =>
                  setProfile({ ...profile, published: e.target.checked })
                }
              />
              <span>
                <b>Показывать автопарк в KEY Marketplace</b>
                <small>
                  Клиенты смогут находить ваши машины по городу и датам.
                </small>
              </span>
            </label>
            <button className="btn primary" disabled={saving}>
              {saving ? "Сохраняем…" : "Сохранить витрину"}
              <Check size={17} />
            </button>
          </form>
        </section>
        <section className="card">
          <div className="card-head">
            <div>
              <span className="kicker">Инвентарь</span>
              <h3>Что увидит клиент</h3>
            </div>
            <span className="count">
              {cars.filter((c) => c.public_enabled).length}/{cars.length}
            </span>
          </div>
          <div className="storefront-cars">
            {cars.map((c) => (
              <div className="storefront-car" key={c.id}>
                <div className="storefront-car-icon">
                  <CarFront size={22} />
                </div>
                <div>
                  <b>
                    {c.brand} {c.model}
                  </b>
                  <small>
                    {money(c.daily_price)}/сут · {c.location}
                  </small>
                </div>
                <button
                  className={`listing-toggle ${c.public_enabled ? "on" : ""}`}
                  onClick={() => toggleCar(c)}
                >
                  {c.public_enabled ? "В каталоге" : "Скрыто"}
                </button>
              </div>
            ))}
            {!cars.length && (
              <Empty
                icon={CarFront}
                title="Сначала добавьте автомобили"
                text="Они появятся здесь для публикации."
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function FinancePage() {
  const [cars, setCars] = useState([]),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState(null);
  async function load() {
    setLoading(true);
    try {
      setCars(await api("/cars"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="page">
      <PageHead
        eyebrow="Финансы"
        title="По каждой машине"
        desc="Сколько машина принесла, сколько потрачено на неё и что осталось."
      />
      <div className="simple-finance-grid">
        {loading ? (
          <div className="market-loading">Загружаем…</div>
        ) : (
          cars.map((c) => (
            <button
              className="simple-finance-card"
              key={c.id}
              onClick={() => setSelected(c)}
            >
              <div className="simple-finance-car">
                <span className="car-status-dot" />
                <div>
                  <b>
                    {c.brand} {c.model}
                  </b>
                  <small>
                    {c.plate} · {c.location}
                  </small>
                </div>
              </div>
              <div className="simple-finance-values">
                <div>
                  <span>Заработала</span>
                  <b>{money(c.revenue)}</b>
                </div>
                <div>
                  <span>Расходы</span>
                  <b>Открыть</b>
                </div>
                <ChevronRight size={17} />
              </div>
            </button>
          ))
        )}
        {!cars.length && !loading && (
          <Empty
            icon={CircleDollarSign}
            title="Машин пока нет"
            text="Добавьте автомобиль — и здесь появится его простая экономика."
          />
        )}
      </div>
      {selected && (
        <CarFinanceModal car={selected} close={() => setSelected(null)} />
      )}
    </div>
  );
}

function SettingsPage({ user, onUser }) {
  const [form, setForm] = useState({ ...user }),
    [saving, setSaving] = useState(false);
  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const u = await api("/profile", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setForm(u);
      onUser(u);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="page">
      <PageHead
        eyebrow="Аккаунт"
        title="Настройки"
        desc="Профиль владельца и параметры рабочего пространства."
      />
      <div className="settings-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <span className="kicker">Профиль</span>
              <h3>Данные владельца</h3>
            </div>
            <Building2 size={20} />
          </div>
          <form className="modal-form" onSubmit={save}>
            <Field label="Имя">
              <input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Телефон">
              <input value={form.phone || ""} disabled />
            </Field>
            <Field label="Email">
              <input
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <div className="two">
              <Field label="Город">
                <input
                  value={form.city || ""}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </Field>
              <Field label="Автопарк">
                <input
                  value={form.company_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, company_name: e.target.value })
                  }
                />
              </Field>
            </div>
            <button className="btn primary" disabled={saving}>
              {saving ? "Сохраняем…" : "Сохранить изменения"}
              <Check size={17} />
            </button>
          </form>
        </section>
        <section className="card">
          <div className="card-head">
            <div>
              <span className="kicker">Вход</span>
              <h3>Безопасность аккаунта</h3>
            </div>
            <ShieldCheck size={20} />
          </div>
          <div className="security-settings">
            <div>
              <Smartphone size={18} />
              <div>
                <b>Телефон</b>
                <small>
                  {user.phone_verified
                    ? "Подтверждён"
                    : "Ожидает подтверждения"}
                </small>
              </div>
              <Status tone={user.phone_verified ? "low" : "medium"}>
                {user.phone_verified ? "OK" : "Далее"}
              </Status>
            </div>
            <div>
              <FileText size={18} />
              <div>
                <b>Email</b>
                <small>
                  {user.email
                    ? "Добавлен как резервный канал"
                    : "Можно добавить в профиле"}
                </small>
              </div>
            </div>
            <div>
              <Sparkles size={18} />
              <div>
                <b>Следующий этап</b>
                <small>
                  OTP, liveness и внешние проверки подключим отдельными
                  адаптерами.
                </small>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
function Modal({ title, close, children }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <span className="kicker">KEY</span>
            <h3>{title}</h3>
          </div>
          <IconButton label="Закрыть" onClick={close}>
            <X size={19} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}
function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      <Icon size={28} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="btn primary" onClick={action}>
          <Plus size={16} />
          Добавить
        </button>
      )}
    </div>
  );
}

const dateOnly = (d) => {
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
};
const today = new Date();
const defaultFrom = dateOnly(new Date(today.getTime() + 24 * 60 * 60 * 1000));
const defaultTo = dateOnly(new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000));

async function publicApi(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw new Error(data?.error || "Не удалось загрузить данные");
  return data;
}
async function customerApi(path, options = {}) {
  const token = localStorage.getItem("key_customer_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw new Error(data?.error || "Не удалось выполнить запрос");
  return data;
}

function MarketplaceHeader({ customer, onAccount, onOwner }) {
  return (
    <header className="market-header">
      <a className="market-brand" href="/">
        <Logo />
      </a>
      <nav className="market-nav">
        <a href="#cars">Автомобили</a>
        <a href="#fleets">Автопарки</a>
        <a href="#how">Как это работает</a>
      </nav>
      <div className="market-actions">
        <button className="market-owner-link" onClick={onOwner}>
          Для владельцев
        </button>
        <button className="market-account" onClick={onAccount}>
          {customer ? (
            <>
              <UserRound size={16} />
              {customer.name?.split(" ")[0] || "Аккаунт"}
            </>
          ) : (
            <>
              <LogIn size={16} />
              Войти
            </>
          )}
        </button>
      </div>
    </header>
  );
}

function Marketplace() {
  const [cars, setCars] = useState([]),
    [fleets, setFleets] = useState([]),
    [city, setCity] = useState(""),
    [q, setQ] = useState(""),
    [from, setFrom] = useState(defaultFrom),
    [to, setTo] = useState(defaultTo),
    [selected, setSelected] = useState(null),
    [auth, setAuth] = useState(false),
    [account, setAccount] = useState(false),
    [customer, setCustomer] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    const token = localStorage.getItem("key_customer_token");
    if (token)
      customerApi("/me")
        .then(setCustomer)
        .catch(() => localStorage.removeItem("key_customer_token"));
    load();
  }, []);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (city) qs.set("city", city);
      if (q) qs.set("q", q);
      if (from && to) {
        qs.set("from", `${from}T00:00:00Z`);
        qs.set("to", `${to}T00:00:00Z`);
      }
      const [cc, ff] = await Promise.all([
        publicApi(`/public/cars?${qs}`),
        publicApi(
          `/public/fleets?city=${encodeURIComponent(city)}&q=${encodeURIComponent(q)}`,
        ),
      ]);
      setCars(cc);
      setFleets(ff);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  function onAuth(u) {
    setCustomer(u);
    setAuth(false);
    if (selected) {
    }
  }
  if (account)
    return (
      <CustomerAccount
        customer={customer}
        onBack={() => setAccount(false)}
        onLogout={() => {
          localStorage.removeItem("key_customer_token");
          setCustomer(null);
          setAccount(false);
        }}
      />
    );
  return (
    <div className="market">
      <MarketplaceHeader
        customer={customer}
        onAccount={() => (customer ? setAccount(true) : setAuth(true))}
        onOwner={() => {
          window.history.pushState({}, "", "/app");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }}
      />
      <section className="market-hero">
        <div className="market-hero-glow" />
        <div className="market-hero-copy">
          <span className="market-kicker">KEY marketplace</span>
          <h1>
            Арендуй машину
            <br />
            <em>без лишнего.</em>
          </h1>
          <p>
            Автомобили от локальных автопарков. Реальная доступность, понятная
            цена и бронь за несколько минут.
          </p>
        </div>
        <div className="search-panel">
          <div className="search-panel-head">
            <span>Найти автомобиль</span>
            <small>Доступность считается в реальном времени</small>
          </div>
          <div className="search-grid">
            <Field label="Город">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Санкт-Петербург"
              />
            </Field>
            <Field label="Получение">
              <input
                type="date"
                value={from}
                min={defaultFrom}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Field>
            <Field label="Возврат">
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
              />
            </Field>
            <Field label="Что ищете?">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Kia, BMW, Premium…"
              />
            </Field>
            <button className="btn primary market-search" onClick={load}>
              <Search size={17} />
              Найти
            </button>
          </div>
        </div>
      </section>
      <section className="market-section" id="cars">
        <div className="market-section-head">
          <div>
            <span className="market-kicker">Каталог</span>
            <h2>Доступные автомобили</h2>
          </div>
          <span className="market-count">
            {loading ? "…" : `${cars.length} предложений`}
          </span>
        </div>
        {error && <div className="market-error">{error}</div>}
        {loading ? (
          <div className="market-loading">Ищем машины…</div>
        ) : cars.length ? (
          <div className="market-car-grid">
            {cars.map((c) => (
              <MarketCar key={c.id} car={c} onClick={() => setSelected(c)} />
            ))}
          </div>
        ) : (
          <div className="market-empty">
            <SearchCheck size={30} />
            <h3>Ничего не нашли</h3>
            <p>Попробуйте другой город, модель или даты.</p>
          </div>
        )}
      </section>
      <section className="market-section fleet-section" id="fleets">
        <div className="market-section-head">
          <div>
            <span className="market-kicker">Партнёры KEY</span>
            <h2>Автопарки</h2>
          </div>
        </div>
        <div className="fleet-market-grid">
          {fleets.map((f) => (
            <div className="fleet-market-card" key={f.id}>
              <div className="fleet-logo">{f.title.slice(0, 1)}</div>
              <div>
                <div className="fleet-title">
                  <h3>{f.title}</h3>
                  <span>
                    <Star size={13} fill="currentColor" />{" "}
                    {f.rating.toFixed?.(1) || f.rating}
                  </span>
                </div>
                <p>{f.description}</p>
                <small>
                  <MapPin size={13} /> {f.city} · {f.available_cars} авто
                  доступны
                </small>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="market-how" id="how">
        <div>
          <span className="market-kicker">Просто</span>
          <h2>
            От поиска до ключей
            <br />в одном потоке.
          </h2>
        </div>
        <div className="how-grid">
          <HowStep
            n="01"
            title="Выберите"
            text="Город, даты и автомобиль от проверенного автопарка."
          />
          <HowStep
            n="02"
            title="Забронируйте"
            text="Вы выбираете свободные даты. Оплата проходит лично с владельцем."
          />
          <HowStep
            n="03"
            title="Получите"
            text="Детали брони и контакты автопарка доступны в аккаунте."
          />
        </div>
      </section>
      <footer className="market-footer">
        <Logo />
        <span>KEY · marketplace + fleet OS</span>
        <button
          onClick={() => {
            window.history.pushState({}, "", "/app");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
        >
          Владельцам автопарков →
        </button>
      </footer>
      {selected && (
        <BookingModal
          car={selected}
          customer={customer}
          from={from}
          to={to}
          close={() => setSelected(null)}
          needAuth={() => setAuth(true)}
          onBooked={() => {
            setSelected(null);
            load();
            setAccount(true);
          }}
        />
      )}
      {auth && <CustomerAuth close={() => setAuth(false)} onAuth={onAuth} />}
    </div>
  );
}
function MarketCar({ car, onClick }) {
  return (
    <button className="market-car" onClick={onClick}>
      <div className="market-car-image">
        {car.image_url ? (
          <img src={car.image_url} alt="" />
        ) : (
          <CarFront size={105} strokeWidth={1} />
        )}
        <span className="market-badge">Доступно</span>
      </div>
      <div className="market-car-body">
        <div className="market-car-title">
          <div>
            <span>{car.category}</span>
            <h3>
              {car.brand} {car.model}
            </h3>
          </div>
          <strong>
            {money(car.daily_price)}
            <small>/сут</small>
          </strong>
        </div>
        <div className="market-specs">
          <span>{car.year}</span>
          <span>{car.transmission}</span>
          <span>{car.seats} мест</span>
          <span>{car.fuel}</span>
        </div>
        <div className="market-owner">
          <span>{car.fleet_title}</span>
          <small>
            <MapPin size={11} /> {car.location}
          </small>
        </div>
      </div>
    </button>
  );
}
function HowStep({ n, title, text }) {
  return (
    <div className="how-step">
      <span>{n}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function CalendarRange({ car, from, to, onChange }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date(`${from}T12:00:00`);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [blocked, setBlocked] = useState([]);
  const [pick, setPick] = useState(from || "");
  const monthKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  useEffect(() => {
    let live = true;
    const a = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const b = new Date(cursor.getFullYear(), cursor.getMonth() + 4, 1);
    publicApi(
      `/public/availability/dates?car_id=${car.id}&from=${dateOnly(a)}&to=${dateOnly(b)}`,
    )
      .then((x) => {
        if (live) setBlocked(x.blocked || []);
      })
      .catch(() => {
        if (live) setBlocked([]);
      });
    return () => {
      live = false;
    };
  }, [car.id, cursor]);
  function daysInMonth(base) {
    const y = base.getFullYear(),
      m = base.getMonth();
    const first = new Date(y, m, 1),
      count = new Date(y, m + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    return { y, m, count, offset };
  }
  function click(day) {
    const value = dateOnly(
      new Date(cursor.getFullYear(), cursor.getMonth(), day),
    );
    if (blocked.includes(value) || value < defaultFrom) return;
    if (!pick || to || value <= pick) {
      setPick(value);
      onChange({ from: value, to: "" });
      return;
    }
    onChange({ from: pick, to: value });
  }
  function cellState(value) {
    const isBlocked = blocked.includes(value);
    const selected = value === from || value === to;
    const inRange = from && to && value > from && value < to;
    return { isBlocked, selected, inRange };
  }
  function panel(base) {
    const { y, m, count, offset } = daysInMonth(base);
    const cells = [];
    for (let i = 0; i < offset; i++)
      cells.push(<span className="range-day empty" key={`e${i}`} />);
    for (let day = 1; day <= count; day++) {
      const value = dateOnly(new Date(y, m, day));
      const st = cellState(value);
      cells.push(
        <button
          type="button"
          key={value}
          disabled={st.isBlocked || value < defaultFrom}
          className={`range-day ${st.isBlocked ? "blocked" : ""} ${st.selected ? "selected" : ""} ${st.inRange ? "in-range" : ""}`}
          onClick={() => click(day)}
        >
          {day}
        </button>,
      );
    }
    return (
      <div className="range-month">
        <div className="range-month-head">
          <b>
            {new Date(y, m, 1).toLocaleDateString("ru-RU", {
              month: "long",
              year: "numeric",
            })}
          </b>
        </div>
        <div className="range-week">
          <span>Пн</span>
          <span>Вт</span>
          <span>Ср</span>
          <span>Чт</span>
          <span>Пт</span>
          <span>Сб</span>
          <span>Вс</span>
        </div>
        <div className="range-grid">{cells}</div>
      </div>
    );
  }
  return (
    <div className="range-picker range-calendar-scroll">
      <div className="range-picker-head compact">
        <div className="range-nav">
          <button
            type="button"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
              )
            }
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
              )
            }
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="range-panels">{panel(cursor)}</div>
      <div className="range-legend">
        <span>
          <i className="legend-free" /> свободно
        </span>
        <span>
          <i className="legend-blocked" /> занято
        </span>
        <span>
          <i className="legend-selected" /> выбрано
        </span>
      </div>
    </div>
  );
}
function BookingModal({ car, customer, from, to, close, needAuth, onBooked }) {
  const [f, setF] = useState({ from, to }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const days =
    f.from && f.to
      ? Math.max(
          1,
          Math.ceil(
            (new Date(`${f.to}T00:00:00Z`) - new Date(`${f.from}T00:00:00Z`)) /
              86400000,
          ),
        )
      : 0;
  const total = days * Number(car.daily_price || 0);
  async function book() {
    if (!customer) {
      needAuth();
      return;
    }
    if (!f.from || !f.to) {
      setError("Выберите дату получения и возврата");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await customerApi("/bookings", {
        method: "POST",
        body: JSON.stringify({
          car_id: car.id,
          starts_at: `${f.from}T12:00:00Z`,
          ends_at: `${f.to}T12:00:00Z`,
          pickup_location: car.location,
          dropoff_location: car.location,
        }),
      });
      onBooked();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <div className="booking-modal booking-modal-wide">
        <div className="booking-body">
          <div className="booking-head">
            <div>
              <span className="market-kicker">Бронь</span>
              <h2>
                {car.brand} {car.model}
              </h2>
              <p>
                {car.location} · {car.transmission} · {car.seats} мест
              </p>
            </div>
            <button className="icon-btn" onClick={close}>
              <X size={20} />
            </button>
          </div>
          <CalendarRange
            car={car}
            from={f.from}
            to={f.to}
            onChange={(x) => setF(x)}
          />
          {days > 0 && (
            <div className="booking-total">
              <span>
                {money(car.daily_price)} × {days} суток
              </span>
              <strong>{money(total)}</strong>
            </div>
          )}
          <div className="booking-note">
            <ShieldCheck size={17} />
            <span>
              Оплата проходит лично с владельцем. После бронирования владелец
              подтвердит бронь и назначит встречу.
            </span>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button
            className="btn primary wide"
            onClick={book}
            disabled={busy || !f.from || !f.to}
          >
            {busy
              ? "Создаём бронь…"
              : customer
                ? "Забронировать"
                : "Войти и забронировать"}
            <ArrowUpRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
function CustomerAuth({ close, onAuth }) {
  const [mode, setMode] = useState("login"),
    [form, setForm] = useState({
      identifier: "",
      name: "",
      phone: "",
      email: "",
      password: "",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body =
        mode === "login"
          ? { identifier: form.identifier, password: form.password }
          : {
              name: form.name,
              phone: form.phone,
              email: form.email,
              password: form.password,
            };
      const d = await publicApi(
        mode === "login" ? "/auth/customer/login" : "/auth/customer/register",
        { method: "POST", body: JSON.stringify(body) },
      );
      localStorage.setItem("key_customer_token", d.token);
      onAuth(d.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <div className="customer-auth">
        <div className="customer-auth-side">
          <Logo />
          <span className="market-kicker">KEY account</span>
          <h2>
            {mode === "login"
              ? "Ваши бронирования — в одном месте."
              : "Создайте аккаунт за минуту."}
          </h2>
          <p>История поездок, детали броней и быстрые повторные аренды.</p>
        </div>
        <div className="customer-auth-form">
          <button className="icon-btn close-auth" onClick={close}>
            <X size={19} />
          </button>
          <span className="kicker">
            {mode === "login" ? "Вход" : "Регистрация"}
          </span>
          <h3>{mode === "login" ? "С возвращением." : "Начнём."}</h3>
          <form onSubmit={submit}>
            {mode === "register" && (
              <>
                <Field label="Имя">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Иван Петров"
                  />
                </Field>
                <Field label="Телефон">
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    required
                    placeholder="+7 999 123-45-67"
                  />
                </Field>
                <Field label="Email · необязательно">
                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="you@mail.ru"
                  />
                </Field>
              </>
            )}
            {mode === "login" && (
              <Field label="Телефон или email">
                <input
                  value={form.identifier}
                  onChange={(e) =>
                    setForm({ ...form, identifier: e.target.value })
                  }
                  required
                />
              </Field>
            )}
            <Field label="Пароль">
              <input
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </Field>
            {error && <div className="form-error">{error}</div>}
            <button className="btn primary wide" disabled={busy}>
              {busy
                ? "Подождите…"
                : mode === "login"
                  ? "Войти"
                  : "Создать аккаунт"}
              <ArrowUpRight size={17} />
            </button>
          </form>
          <button
            className="text-link"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login"
              ? "Создать аккаунт →"
              : "Уже есть аккаунт → войти"}
          </button>
        </div>
      </div>
    </div>
  );
}
function CustomerAccount({ customer, onBack, onLogout }) {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try {
      setItems(await customerApi("/customer/bookings"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function cancel(id) {
    if (confirm("Отменить бронирование?")) {
      await customerApi(`/bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "cancelled",
          reason: "Отменено клиентом",
        }),
      });
      load();
    }
  }
  function meeting(at, loc, label) {
    return at ? (
      <div className="meeting-line">
        <CalendarDays size={15} />
        <span>
          <b>{label}</b>
          {new Date(at).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · {loc || "Место уточняется"}
        </span>
      </div>
    ) : (
      <div className="meeting-line muted">
        <Clock3 size={15} />
        <span>{label}: владелец ещё не назначил</span>
      </div>
    );
  }
  return (
    <div className="account-page">
      <header className="market-header">
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={16} />
          Каталог
        </button>
        <Logo />
        <button className="market-account" onClick={onLogout}>
          <LogOut size={16} />
          Выйти
        </button>
      </header>
      <main className="account-main">
        <div className="account-hero">
          <div>
            <span className="market-kicker">Мой KEY</span>
            <h1>Привет, {customer?.name?.split(" ")[0]}.</h1>
            <p>Здесь все ваши поездки и бронирования.</p>
          </div>
          <div className="account-user">
            <UserRound size={18} />
            {customer?.phone}
          </div>
        </div>
        <section className="account-card">
          <div className="account-card-head">
            <div>
              <span className="kicker">Бронирования</span>
              <h2>Мои поездки</h2>
            </div>
            <span className="market-count">{items.length}</span>
          </div>
          {loading ? (
            <div className="market-loading">Загружаем…</div>
          ) : items.length ? (
            items.map((b) => (
              <div className="booking-row booking-row-rich" key={b.id}>
                <div className="booking-icon">
                  <CarFront size={20} />
                </div>
                <div className="booking-main">
                  <b>{b.car}</b>
                  <span>
                    {b.fleet} · {b.city}
                  </span>
                  <small>
                    {b.booking_code} ·{" "}
                    {new Date(b.starts_at).toLocaleDateString("ru-RU")} —{" "}
                    {new Date(b.ends_at).toLocaleDateString("ru-RU")}
                  </small>
                  {meeting(
                    b.pickup_meeting_at,
                    b.pickup_meeting_location,
                    "Получение",
                  )}
                  {meeting(
                    b.return_meeting_at,
                    b.return_meeting_location,
                    "Возврат",
                  )}
                </div>
                <div className="booking-money">
                  <b>{money(b.amount)}</b>
                  <Status tone={b.status}>
                    {b.status === "pending"
                      ? "Ожидает подтверждения"
                      : b.status === "confirmed"
                        ? "Подтверждено"
                        : b.status === "active"
                          ? "В аренде"
                          : b.status === "cancelled"
                            ? "Отменено"
                            : "В обработке"}
                  </Status>
                  <small>
                    {b.payment_status === "paid"
                      ? "Оплата подтверждена владельцем"
                      : "Оплата на месте"}
                  </small>
                </div>
                {["confirmed", "pending", "hold"].includes(b.status) && (
                  <button
                    className="mini-btn"
                    onClick={() => cancel(b.id)}
                    title="Отменить"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="market-empty">
              <Clock3 size={30} />
              <h3>Бронирований пока нет</h3>
              <p>Выберите автомобиль в каталоге — он появится здесь.</p>
              <button className="btn primary" onClick={onBack}>
                Перейти к автомобилям
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function OwnerApp() {
  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(true),
    [active, setActive] = useState("overview"),
    [alerts, setAlerts] = useState(0);
  useEffect(() => {
    const token = localStorage.getItem("key_token");
    if (!token) {
      setChecking(false);
      return;
    }
    api("/me")
      .then((u) => {
        if (u.role !== "owner") throw new Error("owner");
        setUser(u);
      })
      .catch(() => localStorage.removeItem("key_token"))
      .finally(() => setChecking(false));
    const h = () => setUser(null);
    window.addEventListener("key:logout", h);
    return () => window.removeEventListener("key:logout", h);
  }, []);
  useEffect(() => {
    if (user)
      api("/notifications")
        .then((x) => setAlerts(x.length))
        .catch(() => {});
  }, [user, active]);
  function logout() {
    localStorage.removeItem("key_token");
    setUser(null);
  }
  if (checking)
    return (
      <div className="loading">
        <Logo />
        <div>Загружаем рабочее пространство…</div>
      </div>
    );
  if (!user) return <Auth onAuth={setUser} />;
  let content = <Overview user={user} setActive={setActive} />;
  if (active === "cars") content = <Cars />;
  if (active === "rentals") content = <Rentals />;
  if (active === "clients") content = <Clients />;
  if (active === "security") content = <Security />;
  if (active === "storefront") content = <StorefrontPage />;
  if (active === "finance") content = <FinancePage />;
  if (active === "settings")
    content = <SettingsPage user={user} onUser={setUser} />;
  return (
    <Shell
      user={user}
      active={active}
      setActive={setActive}
      onLogout={logout}
      alerts={alerts}
    >
      {content}
    </Shell>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  if (path.startsWith("/app")) return <OwnerApp />;
  return <Marketplace />;
}

createRoot(document.getElementById("root")).render(<App />);
