import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
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

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Политика конфиденциальности
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Последнее обновление: 22 сентября 2026 г.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">1. Общие положения</h2>
            <p className="mt-2">
              1.1. Настоящая Политика определяет порядок обработки и защиты
              персональных данных пользователей сервиса KEY (далее — Сервис),
              доступного по адресу keyfleet.ru.
            </p>
            <p className="mt-2">
              1.2. Оператором персональных данных является Курочкин Артём
              Михайлович, применяющий специальный налоговый режим «Налог на
              профессиональный доход» (самозанятый), ИНН 713500544320 (далее —
              Оператор).
            </p>
            <p className="mt-2">
              1.3. Используя Сервис, вы соглашаетесь с настоящей Политикой.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">
              2. Какие данные мы собираем
            </h2>
            <p className="mt-2">
              2.1. Оператор может обрабатывать следующие данные:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>ФИО</li>
              <li>номер телефона</li>
              <li>адрес электронной почты</li>
              <li>город</li>
              <li>данные об автомобилях и арендах, которые вы ведёте в Сервисе</li>
              <li>техническая информация: IP-адрес, тип устройства, данные браузера, файлы cookies</li>
            </ul>
            <p className="mt-2">
              2.2. Оператор не обрабатывает специальные категории персональных
              данных (раса, здоровье, политические взгляды и т. п.).
            </p>
            <p className="mt-2">
              2.3. Оператор не обрабатывает биометрические персональные данные.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">
              3. Цели обработки данных
            </h2>
            <p className="mt-2">
              3.1. Персональные данные обрабатываются в целях:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>предоставления доступа к функциональности Сервиса</li>
              <li>авторизации пользователя и подтверждения его личности</li>
              <li>оформления и обработки бронирований автомобилей</li>
              <li>связи с пользователем по вопросам работы Сервиса</li>
              <li>отправки сервисных уведомлений и кодов подтверждения</li>
              <li>улучшения качества работы Сервиса</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">
              4. Правовые основания обработки
            </h2>
            <p className="mt-2">
              4.1. Обработка персональных данных осуществляется на основании:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                согласия субъекта персональных данных, выраженного путём
                проставления отметки при регистрации;
              </li>
              <li>
                необходимости исполнения договора, стороной которого является
                субъект персональных данных;
              </li>
              <li>
                требований законодательства Российской Федерации, в том числе
                Федерального закона № 152-ФЗ «О персональных данных».
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">
              5. Передача данных третьим лицам
            </h2>
            <p className="mt-2">
              5.1. Оператор может передавать персональные данные третьим лицам
              только в случаях, предусмотренных законодательством Российской
              Федерации, либо с согласия пользователя.
            </p>
            <p className="mt-2">
              5.2. Для обеспечения работы Сервиса данные могут передаваться:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>хостинг-провайдеру, на серверах которого размещён Сервис;</li>
              <li>сервису отправки электронной почты (SMTP-провайдер);</li>
              <li>сервису отправки SMS-сообщений (для подтверждения телефона);</li>
              <li>платёжному провайдеру ЮKassa (для обработки платежей и формирования чеков);</li>
            </ul>
            <p className="mt-2">
              5.3. Все третьи лица, получающие доступ к данным, обязуются
              соблюдать конфиденциальность.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">
              6. Место и сроки хранения
            </h2>
            <p className="mt-2">
              6.1. Персональные данные хранятся на серверах, расположенных на
              территории Российской Федерации.
            </p>
            <p className="mt-2">
              6.2. Срок хранения — до достижения целей обработки либо до отзыва
              согласия субъектом персональных данных.
            </p>
            <p className="mt-2">
              6.3. После прекращения обработки данные удаляются или
              обезличиваются в срок, не превышающий 30 дней, если иное не
              предусмотрено законодательством.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">
              7. Права пользователя
            </h2>
            <p className="mt-2">7.1. Пользователь вправе:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                получать информацию, касающуюся обработки его персональных
                данных;
              </li>
              <li>требовать уточнения, блокирования или уничтожения данных;</li>
              <li>отозвать согласие на обработку персональных данных;</li>
              <li>
                обжаловать действия Оператора в Роскомнадзоре или в суде.
              </li>
            </ul>
            <p className="mt-2">
              7.2. Для реализации своих прав обратитесь по адресу{" "}
              <a
                href="mailto:ArtTeam71@yandex.ru"
                className="text-primary underline-offset-4 hover:underline"
              >
                ArtTeam71@yandex.ru
              </a>
              . Оператор рассматривает обращения в течение 10 рабочих дней.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Cookies</h2>
            <p className="mt-2">
              8.1. Сервис использует cookies для авторизации и корректной работы
              интерфейса. Вы можете отключить cookies в настройках браузера, но
              часть функциональности станет недоступна.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">
              9. Изменение Политики
            </h2>
            <p className="mt-2">
              9.1. Оператор вправе изменять настоящую Политику. Новая редакция
              вступает в силу с момента публикации на этой странице.
            </p>
            <p className="mt-2">
              9.2. Актуальная версия всегда доступна по адресу keyfleet.ru/privacy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Контакты</h2>
            <p className="mt-2">
              Курочкин Артём Михайлович
              <br />
              ИНН: 713500544320
              <br />
              Email:{" "}
              <a
                href="mailto:ArtTeam71@yandex.ru"
                className="text-primary underline-offset-4 hover:underline"
              >
                ArtTeam71@yandex.ru
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}