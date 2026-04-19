use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "UPPERCASE")]
pub enum ImageFormat {
    JPG,
    JPEG,
    PNG,
    WEBP,
    GIF,
    BMP,
    TIFF,
    HEIC,
    SVG,
    ICO,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "UPPERCASE")]
pub enum VideoFormat {
    MP4,
    MKV,
    WEBM,
    MOV,
    AVI,
    FLV,
    #[serde(rename = "3GP")]
    THREEGP,
    M4V,
    TS,
    WMV,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "UPPERCASE")]
pub enum AudioFormat {
    MP3,
    WAV,
    FLAC,
    AAC,
    OGG,
    M4A,
    OPUS,
    WMA,
    ALAC,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "UPPERCASE")]
pub enum DocumentFormat {
    PDF,
    DOCX,
    TXT,
    MD,
    HTML,
    RTF,
    EPUB,
    ODT,
    RST,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "UPPERCASE")]
pub enum ArchiveFormat {
    ZIP,
    #[serde(rename = "7Z")]
    SEVENZ,
    TAR,
    RAR,
    GZ,
    BZIP2,
    XZ,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(tag = "type", content = "value")]
pub enum Format {
    Image(ImageFormat),
    Video(VideoFormat),
    Audio(AudioFormat),
    Document(DocumentFormat),
    Archive(ArchiveFormat),
}

impl Format {
    pub fn from_extension(ext: &str) -> Option<Self> {
        match ext.to_lowercase().as_str() {
            // Images
            "jpg" | "jpeg" => Some(Format::Image(ImageFormat::JPEG)),
            "png" => Some(Format::Image(ImageFormat::PNG)),
            "webp" => Some(Format::Image(ImageFormat::WEBP)),
            "gif" => Some(Format::Image(ImageFormat::GIF)),
            "bmp" => Some(Format::Image(ImageFormat::BMP)),
            "tiff" | "tif" => Some(Format::Image(ImageFormat::TIFF)),
            "heic" | "heif" => Some(Format::Image(ImageFormat::HEIC)),
            "svg" => Some(Format::Image(ImageFormat::SVG)),
            "ico" => Some(Format::Image(ImageFormat::ICO)),

            // Videos
            "mp4" => Some(Format::Video(VideoFormat::MP4)),
            "mkv" => Some(Format::Video(VideoFormat::MKV)),
            "webm" => Some(Format::Video(VideoFormat::WEBM)),
            "mov" => Some(Format::Video(VideoFormat::MOV)),
            "avi" => Some(Format::Video(VideoFormat::AVI)),
            "flv" => Some(Format::Video(VideoFormat::FLV)),
            "3gp" | "3gpp" => Some(Format::Video(VideoFormat::THREEGP)),
            "m4v" => Some(Format::Video(VideoFormat::M4V)),
            "ts" | "mts" | "m2ts" => Some(Format::Video(VideoFormat::TS)),
            "wmv" => Some(Format::Video(VideoFormat::WMV)),

            // Audio
            "mp3" => Some(Format::Audio(AudioFormat::MP3)),
            "wav" => Some(Format::Audio(AudioFormat::WAV)),
            "flac" => Some(Format::Audio(AudioFormat::FLAC)),
            "aac" => Some(Format::Audio(AudioFormat::AAC)),
            "ogg" => Some(Format::Audio(AudioFormat::OGG)),
            "m4a" => Some(Format::Audio(AudioFormat::M4A)),
            "opus" => Some(Format::Audio(AudioFormat::OPUS)),
            "wma" => Some(Format::Audio(AudioFormat::WMA)),
            "caf" | "alac" => Some(Format::Audio(AudioFormat::ALAC)),

            // Documents
            "pdf" => Some(Format::Document(DocumentFormat::PDF)),
            "docx" => Some(Format::Document(DocumentFormat::DOCX)),
            "txt" => Some(Format::Document(DocumentFormat::TXT)),
            "md" | "markdown" => Some(Format::Document(DocumentFormat::MD)),
            "html" | "htm" => Some(Format::Document(DocumentFormat::HTML)),
            "rtf" => Some(Format::Document(DocumentFormat::RTF)),
            "epub" => Some(Format::Document(DocumentFormat::EPUB)),
            "odt" => Some(Format::Document(DocumentFormat::ODT)),
            "rst" => Some(Format::Document(DocumentFormat::RST)),

            // Archives
            "zip" => Some(Format::Archive(ArchiveFormat::ZIP)),
            "7z" => Some(Format::Archive(ArchiveFormat::SEVENZ)),
            "tar" => Some(Format::Archive(ArchiveFormat::TAR)),
            "rar" => Some(Format::Archive(ArchiveFormat::RAR)),
            "gz" | "tgz" => Some(Format::Archive(ArchiveFormat::GZ)),
            "bz2" | "tbz2" | "bzip2" => Some(Format::Archive(ArchiveFormat::BZIP2)),
            "xz" | "txz" => Some(Format::Archive(ArchiveFormat::XZ)),

            _ => None,
        }
    }

    pub fn to_extension(&self) -> &'static str {
        match self {
            Format::Image(img) => match img {
                ImageFormat::JPG | ImageFormat::JPEG => "jpg",
                ImageFormat::PNG => "png",
                ImageFormat::WEBP => "webp",
                ImageFormat::GIF => "gif",
                ImageFormat::BMP => "bmp",
                ImageFormat::TIFF => "tiff",
                ImageFormat::HEIC => "heic",
                ImageFormat::SVG => "svg",
                ImageFormat::ICO => "ico",
            },
            Format::Video(vid) => match vid {
                VideoFormat::MP4 => "mp4",
                VideoFormat::MKV => "mkv",
                VideoFormat::WEBM => "webm",
                VideoFormat::MOV => "mov",
                VideoFormat::AVI => "avi",
                VideoFormat::FLV => "flv",
                VideoFormat::THREEGP => "3gp",
                VideoFormat::M4V => "m4v",
                VideoFormat::TS => "ts",
                VideoFormat::WMV => "wmv",
            },
            Format::Audio(aud) => match aud {
                AudioFormat::MP3 => "mp3",
                AudioFormat::WAV => "wav",
                AudioFormat::FLAC => "flac",
                AudioFormat::AAC => "aac",
                AudioFormat::OGG => "ogg",
                AudioFormat::M4A => "m4a",
                AudioFormat::OPUS => "opus",
                AudioFormat::WMA => "wma",
                AudioFormat::ALAC => "caf",
            },
            Format::Document(doc) => match doc {
                DocumentFormat::PDF => "pdf",
                DocumentFormat::DOCX => "docx",
                DocumentFormat::TXT => "txt",
                DocumentFormat::MD => "md",
                DocumentFormat::HTML => "html",
                DocumentFormat::RTF => "rtf",
                DocumentFormat::EPUB => "epub",
                DocumentFormat::ODT => "odt",
                DocumentFormat::RST => "rst",
            },
            Format::Archive(arc) => match arc {
                ArchiveFormat::ZIP => "zip",
                ArchiveFormat::SEVENZ => "7z",
                ArchiveFormat::TAR => "tar",
                ArchiveFormat::RAR => "rar",
                ArchiveFormat::GZ => "gz",
                ArchiveFormat::BZIP2 => "bz2",
                ArchiveFormat::XZ => "xz",
            },
        }
    }
}
