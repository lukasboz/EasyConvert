use crate::converters::{
    archive::ArchiveConverter,
    document::DocumentConverter,
    image::ImageConverter,
    traits::Converter,
    video::VideoConverter,
};
use crate::models::format::Format;
use anyhow::{Context, Result};
use std::sync::Arc;

pub struct FormatRouter {
    converters: Vec<Arc<dyn Converter>>,
}

impl FormatRouter {
    pub fn new() -> Self {
        let converters: Vec<Arc<dyn Converter>> = vec![
            Arc::new(ImageConverter::new()),
            Arc::new(VideoConverter::new()),
            Arc::new(DocumentConverter::new()),
            Arc::new(ArchiveConverter::new()),
        ];

        Self { converters }
    }

    pub fn get_converter(&self, from: &Format, to: &Format) -> Result<Arc<dyn Converter>> {
        self.converters
            .iter()
            .find(|c| c.can_convert(from, to))
            .cloned()
            .context(format!("No converter found for {:?} to {:?}", from, to))
    }

    pub fn validate_conversion(&self, from: &Format, to: &Format) -> bool {
        self.converters.iter().any(|c| c.can_convert(from, to))
    }

    pub fn get_supported_outputs(&self, input_format: &Format) -> Vec<Format> {
        self.converters
            .iter()
            .filter(|c| c.supported_inputs().contains(input_format))
            .flat_map(|c| c.supported_outputs())
            .filter(|output| output != input_format)
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect()
    }
}

impl Default for FormatRouter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::format::{ImageFormat, VideoFormat};

    #[test]
    fn test_router_finds_image_converter() {
        let router = FormatRouter::new();
        let from = Format::Image(ImageFormat::JPG);
        let to = Format::Image(ImageFormat::PNG);

        let result = router.get_converter(&from, &to);
        assert!(result.is_ok());
    }

    #[test]
    fn test_router_validates_conversion() {
        let router = FormatRouter::new();
        let from = Format::Image(ImageFormat::JPG);
        let to = Format::Image(ImageFormat::PNG);

        assert!(router.validate_conversion(&from, &to));
    }

    #[test]
    fn test_router_rejects_invalid_conversion() {
        let router = FormatRouter::new();
        let from = Format::Image(ImageFormat::JPG);
        let to = Format::Video(VideoFormat::MP4);

        assert!(!router.validate_conversion(&from, &to));
    }

    #[test]
    fn test_get_supported_outputs() {
        let router = FormatRouter::new();
        let input = Format::Image(ImageFormat::JPG);

        let outputs = router.get_supported_outputs(&input);
        assert!(!outputs.is_empty());
        assert!(outputs.iter().all(|f| matches!(f, Format::Image(_))));
    }
}
