// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// use core::unicode::conversions::to_lower;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn scan_dir(directory: &str) -> Result<ScanResults, ()> {
    let mut results = ScanResults::default();
    println!("Scanning directory: {}", directory);

    // Walk the directory and return the results
    // let mut results = String::new();

    let image_extensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

    for entry in walkdir::WalkDir::new(directory) {
        let entry = entry.unwrap();
        let path = entry.path();
        let path_str = path.to_str().unwrap();

        results.total_files += 1;

        if !path.is_file() {
            continue;
        }

        // println!("Found file: {}", path_str);

        let extension = path
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| ext.to_lowercase())
            .unwrap_or_default();

        if !image_extensions.contains(&extension.as_str()) {
            continue;
        }

        results.total_images += 1;

        // Check if the file is an image
        let image = image::open(path_str);

        println!("Found image: {}", path_str);

        if image.is_err() {
            // results.push_str(&format!("Error opening image: {}", path_str));
            println!("Error opening image: {}", path_str);

            results.total_errors += 1;
            results.errors.push(path_str.to_string());
        }
    }

    Ok(results)
}

#[derive(Default, Debug, serde::Serialize)]
struct ScanResults {
    total_files: u32,
    total_images: u32,
    total_errors: u32,
    errors: Vec<String>,
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, scan_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
