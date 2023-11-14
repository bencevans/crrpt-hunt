// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// use core::unicode::conversions::to_lower;

use rayon::prelude::*;
use tauri::{Manager, Window};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn scan_dir(paths: Vec<String>) -> Result<ScanResults, ()> {
    println!("Scanning paths: {:?}", paths);

    // Walk the directory and return the results
    // let mut results = String::new();

    let image_extensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

    let results = paths
        .iter()
        .map(|path| {
            walkdir::WalkDir::new(path)
                .into_iter()
                .par_bridge()
                .map(|entry| entry.unwrap())
                .filter(|entry| entry.path().is_file())
                .map(|entry| {
                    let path_str = entry.path().to_str().unwrap();

                    let is_image_extension = entry
                        .path()
                        .extension()
                        .and_then(|ext| ext.to_str())
                        .map(|ext| ext.to_lowercase())
                        .filter(|ext| image_extensions.contains(&ext.as_str()))
                        .is_some();

                    if !is_image_extension {
                        return ScanResults {
                            total_files: 1,
                            ..Default::default()
                        };
                    }

                    let image = image::open(path_str);

                    ScanResults {
                        total_files: 1,
                        total_images: 1,
                        total_errors: {
                            if image.is_err() {
                                1
                            } else {
                                0
                            }
                        },
                        errors: {
                            if image.is_err() {
                                vec![path_str.to_string()]
                            } else {
                                vec![]
                            }
                        },
                    }
                })
                .reduce(ScanResults::default, |mut acc, item| {
                    acc.total_files += item.total_files;
                    acc.total_images += item.total_images;
                    acc.total_errors += item.total_errors;
                    acc.errors.extend(item.errors);
                    acc
                })
        })
        .reduce(|mut acc, item| {
            acc.total_files += item.total_files;
            acc.total_images += item.total_images;
            acc.total_errors += item.total_errors;
            acc.errors.extend(item.errors);
            acc
        });

    Ok(results.unwrap())
}

#[derive(Default, Debug, serde::Serialize)]
struct ScanResults {
    total_files: u32,
    total_images: u32,
    total_errors: u32,
    errors: Vec<String>,
}

#[tauri::command]
async fn showup(window: Window) {
    window.get_window("main").unwrap().show().unwrap(); // replace "main" by the name of your window
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, scan_dir, showup])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
