// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::{
    CustomMenuItem, Menu, MenuItem, Submenu,
    WindowMenuEvent,
};

#[derive(Serialize)]
struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
}

#[tauri::command]
fn read_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let dir_path = Path::new(&path);

    if !dir_path.exists() {
        return Err("Directory does not exist".to_string());
    }

    if !dir_path.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let mut entries: Vec<FileEntry> = Vec::new();

    match fs::read_dir(dir_path) {
        Ok(read_dir) => {
            for entry in read_dir.flatten() {
                let file_name = entry.file_name().to_string_lossy().to_string();

                // Skip hidden files (starting with .)
                if file_name.starts_with('.') {
                    continue;
                }

                let file_path = entry.path().to_string_lossy().to_string();
                let is_dir = entry.path().is_dir();

                entries.push(FileEntry {
                    name: file_name,
                    path: file_path,
                    is_dir,
                });
            }

            // Sort: directories first, then files, both alphabetically
            entries.sort_by(|a, b| {
                match (a.is_dir, b.is_dir) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                }
            });

            Ok(entries)
        }
        Err(e) => Err(format!("Failed to read directory: {}", e)),
    }
}

fn build_menu() -> Menu {
    // App menu
    let app_menu = Submenu::new(
        "Markdown Viewer",
        Menu::new()
            .add_native_item(MenuItem::About(
                "Markdown Viewer".to_string(),
                Default::default(),
            ))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Hide)
            .add_native_item(MenuItem::HideOthers)
            .add_native_item(MenuItem::ShowAll)
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("quit", "Quit Markdown Viewer").accelerator("CmdOrCtrl+Q")),
    );

    // File menu
    let file_menu = Submenu::new(
        "File",
        Menu::new()
            .add_item(CustomMenuItem::new("new_file", "New File").accelerator("CmdOrCtrl+N"))
            .add_item(CustomMenuItem::new("open_file", "Open File...").accelerator("CmdOrCtrl+O"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("save", "Save").accelerator("CmdOrCtrl+S"))
            .add_item(
                CustomMenuItem::new("save_as", "Save As...").accelerator("CmdOrCtrl+Shift+S"),
            )
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("close_tab", "Close Tab").accelerator("CmdOrCtrl+W")),
    );

    // Edit menu - use native items so the webview handles them automatically
    let edit_menu = Submenu::new(
        "Edit",
        Menu::new()
            .add_native_item(MenuItem::Undo)
            .add_native_item(MenuItem::Redo)
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Cut)
            .add_native_item(MenuItem::Copy)
            .add_native_item(MenuItem::Paste)
            .add_native_item(MenuItem::SelectAll),
    );

    // View menu
    let view_menu = Submenu::new(
        "View",
        Menu::new()
            .add_item(
                CustomMenuItem::new("toggle_sidebar", "Toggle Sidebar").accelerator("CmdOrCtrl+B"),
            ),
    );

    // Window menu
    let window_menu = Submenu::new(
        "Window",
        Menu::new()
            .add_native_item(MenuItem::Minimize)
            .add_native_item(MenuItem::Zoom)
            .add_native_item(MenuItem::CloseWindow),
    );

    Menu::new()
        .add_submenu(app_menu)
        .add_submenu(file_menu)
        .add_submenu(edit_menu)
        .add_submenu(view_menu)
        .add_submenu(window_menu)
}

fn handle_menu_event(event: WindowMenuEvent) {
    let menu_id = event.menu_item_id();
    match menu_id {
        "quit" => {
            // Emit to frontend so it can check for unsaved changes
            let _ = event.window().emit("menu-event", "quit");
        }
        "new_file" | "open_file" | "save" | "save_as" | "close_tab" | "toggle_sidebar" => {
            let _ = event.window().emit("menu-event", menu_id);
        }
        _ => {}
    }
}

fn main() {
    tauri::Builder::default()
        .menu(build_menu())
        .on_menu_event(handle_menu_event)
        .invoke_handler(tauri::generate_handler![read_directory])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
