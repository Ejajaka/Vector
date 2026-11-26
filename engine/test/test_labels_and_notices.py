"""A retry banner is a container, and bare articles are not labels."""
from src.linking import link_spans_to_elements
from src.schema import NOUN_TO_TYPE, Span
from src.tokenization import tokenize_with_offsets


def test_banner_and_empty_state_map_to_card():
    assert NOUN_TO_TYPE("retry banner") == "card"
    assert NOUN_TO_TYPE("empty state") == "card"
    assert NOUN_TO_TYPE("hero image") == "image"


def test_determiner_only_labels_are_dropped():
    text = "Add an image and an retry banner"
    tokens = tokenize_with_offsets(text)
    spans = [
        Span(label="ELEMENT", start=2, end=3, text="banner", char_start=21, char_end=27),
        Span(label="LABEL", start=3, end=4, text="an", char_start=0, char_end=2),
    ]
    elements = link_spans_to_elements(spans, tokens, text)
    labels = [attribute.text for element in elements for attribute in element.attributes.get("LABEL", [])]
    assert "an" not in labels
