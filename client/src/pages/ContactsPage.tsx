import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  Send,
  MapPin,
  FileText,
  Clock,
  User,
} from "lucide-react";
import { Logo } from "@/components/layout";
import { Card, CardContent } from "@/components/ui";

export function ContactsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
          <Logo size="md" />
          <div className="w-20" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Контакты
          </span>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Свяжитесь с нами
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            KEY — сервис аренды автомобилей от частных автопарков. Мы на связи
            по телефону, email и в Telegram, отвечаем в течение одного рабочего
            дня.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Телефон */}
          <Card>
            <CardContent className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4 text-sm font-medium">Телефон</div>
              <a
                href="tel:+79028403940"
                className="mt-1 block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                +7 902 840-39-40
              </a>
              <p className="mt-2 text-xs text-muted-foreground">
                Звонки по будням с 10:00 до 19:00 (МСК).
              </p>
            </CardContent>
          </Card>

          {/* Email */}
          <Card>
            <CardContent className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4 text-sm font-medium">Email</div>
              <a
                href="mailto:ArtTeam71@yandex.ru"
                className="mt-1 block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                ArtTeam71@yandex.ru
              </a>
              <p className="mt-2 text-xs text-muted-foreground">
                Для общих вопросов, поддержки и по вопросам оплаты.
              </p>
            </CardContent>
          </Card>

          {/* Telegram */}
          <Card>
            <CardContent className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4 text-sm font-medium">Telegram</div>
              <a
                href="https://t.me/artteam71"
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                @artteam71
              </a>
              <p className="mt-2 text-xs text-muted-foreground">
                Быстрая связь по техническим вопросам.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Реквизиты */}
        <div className="mt-8 rounded-2xl border border-border bg-secondary/40 p-8">
          <h2 className="text-base font-semibold">Реквизиты исполнителя</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-muted-foreground">ФИО</dt>
                <dd className="font-medium">Курочкин Артём Михайлович</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-muted-foreground">ИНН</dt>
                <dd className="font-medium">713500544320</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-muted-foreground">Статус</dt>
                <dd className="font-medium">Самозанятый (плательщик НПД)</dd>
              </div>
            </div>
          </dl>
          <p className="mt-5 text-xs text-muted-foreground">
            Чеки формируются в приложении «Мой налог» и направляются
            покупателю после оплаты.
          </p>
        </div>

        {/* Время работы */}
        <div className="mt-8 rounded-2xl border border-border bg-secondary/40 p-8">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <h2 className="text-base font-semibold">Время работы</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Поддержка по телефону, email и в Telegram — по будням с 10:00
                до 19:00 (МСК). Запросы, поступившие в выходные, обрабатываются
                в первый рабочий день.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>Курочкин Артём Михайлович · ИНН 713500544320 · самозанятый</p>
          <p className="mt-3">
            <Link
              to="/terms"
              className="text-primary underline-offset-4 hover:underline"
            >
              Пользовательское соглашение
            </Link>
            {" · "}
            <Link
              to="/privacy"
              className="text-primary underline-offset-4 hover:underline"
            >
              Политика конфиденциальности
            </Link>
            {" · "}
            <Link
              to="/pricing"
              className="text-primary underline-offset-4 hover:underline"
            >
              Тарифы
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}