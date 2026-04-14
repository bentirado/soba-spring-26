"""ETL pipeline orchestrator and transaction layer."""

from __future__ import annotations

from .extractor import DummyDataExtractor
from .loader import Loader, TerminalLoader
from ..schema import CanonicalPayload
from .transformer import TransformAgent


class TransactionLayer:
    """Owns loader selection and invocation."""

    def __init__(self, loader: Loader | None = None):
        self.loader: Loader = loader or TerminalLoader()

    def commit(self, payloads: list[CanonicalPayload]) -> None:
        self.loader.load(payloads)


class ETLPipeline:
    def __init__(
        self,
        extractor: DummyDataExtractor | None = None,
        transform_agent: TransformAgent | None = None,
        transaction_layer: TransactionLayer | None = None,
    ):
        self.extractor = extractor or DummyDataExtractor()
        self.transform_agent = transform_agent or TransformAgent()
        self.transaction_layer = transaction_layer or TransactionLayer()

    def run(self) -> list[CanonicalPayload]:
        extracted = self.extractor.extract()
        transformed = [self.transform_agent.transform(ds) for ds in extracted]
        self.transaction_layer.commit(transformed)
        return transformed
