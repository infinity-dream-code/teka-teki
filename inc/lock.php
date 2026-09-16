<?php

function client_ip() {
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function ip_hash($ip) {
    return hash('sha256', 'mtr19|' . $ip);
}

function cookie_secure_suffix() {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? '; Secure' : '';
}

function set_named_cookie($name, $value = '1') {
    header(
        'Set-Cookie: ' . $name . '=' . $value . '; Path=/; Max-Age=315360000; HttpOnly; SameSite=Lax' . cookie_secure_suffix(),
        false
    );
}

function blocked_path() {
    $dir = dirname(__DIR__) . '/data';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir . '/blocked.json';
}

function cookie_blocked() {
    return !empty($_COOKIE['mtr19_lock']);
}

function set_lock_cookie() {
    set_named_cookie('mtr19_lock');
}

function file_blocked($ip) {
    $file = blocked_path();
    if (!is_file($file)) {
        return false;
    }
    $data = json_decode(@file_get_contents($file), true);
    return is_array($data) && isset($data[ip_hash($ip)]);
}

function is_blocked($ip) {
    return cookie_blocked() || file_blocked($ip);
}

function block_ip($ip) {
    set_lock_cookie();
    $file = blocked_path();
    $fp = @fopen($file, 'c+');
    if (!$fp) {
        return;
    }
    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        $data = [];
    }
    $data[ip_hash($ip)] = time();
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($data));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function has_l1() {
    return !empty($_COOKIE['mtr19_l1']);
}

function has_l2() {
    return !empty($_COOKIE['mtr19_l2']);
}
