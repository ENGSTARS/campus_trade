import csv
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from api.models import UniversityEmail


class Command(BaseCommand):
    help = "Seed approved university emails for student registration."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            action="append",
            dest="emails",
            default=[],
            help="Approved email to seed. Repeat the flag to add multiple emails.",
        )
        parser.add_argument(
            "--file",
            type=str,
            help="Path to a CSV or newline-delimited text file with approved emails.",
        )
        parser.add_argument(
            "--campus",
            default="",
            help="Default campus to apply when an entry does not provide one.",
        )
        parser.add_argument(
            "--full-name",
            default="",
            dest="full_name",
            help="Default full name to apply when an entry does not provide one.",
        )
        parser.add_argument(
            "--update-existing",
            action="store_true",
            help="Update existing university email rows instead of leaving them unchanged.",
        )

    def handle(self, *args, **options):
        rows = []
        default_campus = (options.get("campus") or "").strip()
        default_full_name = (options.get("full_name") or "").strip()
        update_existing = bool(options.get("update_existing"))

        for email in options.get("emails") or []:
            normalized_email = self._normalize_email(email)
            rows.append(
                {
                    "email": normalized_email,
                    "full_name": default_full_name,
                    "campus": default_campus,
                }
            )

        file_path = options.get("file")
        if file_path:
            rows.extend(
                self._load_rows_from_file(
                    file_path=file_path,
                    default_full_name=default_full_name,
                    default_campus=default_campus,
                )
            )

        if not rows:
            raise CommandError("Provide at least one --email or a --file path.")

        # Deduplicate by email in the order provided.
        deduped_rows = []
        seen = set()
        for row in rows:
            if row["email"] in seen:
                continue
            seen.add(row["email"])
            deduped_rows.append(row)

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for row in deduped_rows:
            university_email, created = UniversityEmail.objects.get_or_create(
                email=row["email"],
                defaults={
                    "full_name": row["full_name"],
                    "campus": row["campus"],
                },
            )

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created {row['email']}"))
                continue

            if not update_existing:
                skipped_count += 1
                self.stdout.write(self.style.WARNING(f"Skipped existing {row['email']}"))
                continue

            changed_fields = []
            if row["full_name"] and university_email.full_name != row["full_name"]:
                university_email.full_name = row["full_name"]
                changed_fields.append("full_name")
            if row["campus"] and university_email.campus != row["campus"]:
                university_email.campus = row["campus"]
                changed_fields.append("campus")

            if changed_fields:
                university_email.save(update_fields=changed_fields)
                updated_count += 1
                self.stdout.write(self.style.SUCCESS(f"Updated {row['email']}"))
            else:
                skipped_count += 1
                self.stdout.write(self.style.WARNING(f"Skipped existing {row['email']}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created: {created_count}, Updated: {updated_count}, Skipped: {skipped_count}"
            )
        )

    def _normalize_email(self, email):
        normalized = (email or "").strip().lower()
        if not normalized:
            raise CommandError("Email values cannot be blank.")
        return normalized

    def _load_rows_from_file(self, file_path, default_full_name, default_campus):
        path = Path(file_path)
        if not path.exists():
            raise CommandError(f"File does not exist: {path}")

        if path.suffix.lower() == ".csv":
            return self._load_rows_from_csv(path, default_full_name, default_campus)
        return self._load_rows_from_text(path, default_full_name, default_campus)

    def _load_rows_from_csv(self, path, default_full_name, default_campus):
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames or "email" not in reader.fieldnames:
                raise CommandError("CSV files must include an 'email' column.")

            rows = []
            for row in reader:
                rows.append(
                    {
                        "email": self._normalize_email(row.get("email")),
                        "full_name": (row.get("full_name") or default_full_name or "").strip(),
                        "campus": (row.get("campus") or default_campus or "").strip(),
                    }
                )
            return rows

    def _load_rows_from_text(self, path, default_full_name, default_campus):
        rows = []
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                email = line.strip()
                if not email:
                    continue
                rows.append(
                    {
                        "email": self._normalize_email(email),
                        "full_name": default_full_name,
                        "campus": default_campus,
                    }
                )
        return rows
