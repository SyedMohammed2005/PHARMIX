import { LucideIcon } from "lucide-react";

type StatsCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
}: StatsCardProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </h3>

          {description && (
            <p className="mt-2 text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>

        <div className="rounded-lg bg-gray-100 p-3">
          <Icon
            size={22}
            className="text-gray-700"
          />
        </div>
      </div>
    </div>
  );
}