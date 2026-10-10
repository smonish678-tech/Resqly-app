import unittest
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from agora_token.RtcTokenBuilder2 import Role_Publisher, RtcTokenBuilder


class AgoraTokenBuilderTests(unittest.TestCase):
    def setUp(self):
        # Dummy credentials are only used to verify deterministic token creation.
        # No network request or real Agora project is involved.
        self.app_id = "0123456789abcdef0123456789abcdef"
        self.app_certificate = "abcdef0123456789abcdef0123456789"
        self.channel = "resqly_test_channel"

    def test_generates_access_token2_for_numeric_uid(self):
        token = RtcTokenBuilder.build_token_with_uid(
            self.app_id,
            self.app_certificate,
            self.channel,
            12345,
            Role_Publisher,
            3600,
            3600,
        )
        self.assertTrue(token.startswith("007"))
        self.assertGreater(len(token), 100)

    def test_token_is_bound_to_uid_and_channel(self):
        first = RtcTokenBuilder.build_token_with_uid(
            self.app_id, self.app_certificate, self.channel, 12345, Role_Publisher, 3600, 3600
        )
        second = RtcTokenBuilder.build_token_with_uid(
            self.app_id, self.app_certificate, self.channel, 12346, Role_Publisher, 3600, 3600
        )
        third = RtcTokenBuilder.build_token_with_uid(
            self.app_id, self.app_certificate, "resqly_other_channel", 12345, Role_Publisher, 3600, 3600
        )
        self.assertNotEqual(first, second)
        self.assertNotEqual(first, third)


if __name__ == "__main__":
    unittest.main()
