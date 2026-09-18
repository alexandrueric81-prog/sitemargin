import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const t = await getTranslations("HomePage");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="border-border bg-card w-full max-w-xl rounded-xl border p-6 shadow-sm sm:p-8">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-2 text-base">{t("subtitle")}</p>

        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-foreground font-medium">{t("stageLabel")}</dt>
            <dd className="text-muted-foreground">{t("stageValue")}</dd>
          </div>
          <div>
            <dt className="text-foreground font-medium">{t("nextLabel")}</dt>
            <dd className="text-muted-foreground">{t("nextValue")}</dd>
          </div>
        </dl>

        <Button disabled className="mt-6 w-full sm:w-auto">
          {t("cta")}
        </Button>
      </div>
    </main>
  );
}
