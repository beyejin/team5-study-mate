import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_key: str

    @classmethod
    def from_env(cls) -> "Settings":
        url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
        key = (
            os.getenv("SUPABASE_SECRET_KEY", "").strip()
            or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        )
        if not url or not key:
            raise RuntimeError(
                "Set SUPABASE_URL and SUPABASE_SECRET_KEY in the environment or .env file."
            )
        return cls(supabase_url=url, supabase_key=key)
