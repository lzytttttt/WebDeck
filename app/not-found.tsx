import Link from "next/link";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = getDictionary();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-foreground">{t.errors.notFoundTitle}</h1>
      <p className="text-muted-foreground">{t.errors.notFoundBody}</p>
      <Link href="/">
        <Button variant="outline">{t.errors.backHome}</Button>
      </Link>
    </div>
  );
}
