import {Injectable} from "@angular/core";
import * as crypto from "crypto-js";

@Injectable({
  providedIn: 'root'
})
/**
 * The CryptoService encapsulates encryption functionality using the crypto-js library.
 */
export class CryptoService {

  constructor() {
  }

  /**
   * Encrypts a plaintext using AES 256/CBC with the given password.
   * @param plaintext the plaintext to encrypt
   * @param password the password / secret
   * @returns {string} the encrypted value (incl. an integrity check prefix)
   */
  encrypt(plaintext: string, password: string): string {
    return crypto.AES.encrypt("CHECK" + plaintext, password).toString();
  }

  /**
   * Decrypts a ciphertext using AES 256/CBC with the given password.
   * @param ciphertext the ciphertext to decrypt
   * @param password the password / secret
   * @returns {any} the decrypted string or null if the integrity check fails
   */
  decrypt(ciphertext: string, password: string): string {
    let decrypted: string = crypto.AES.decrypt(ciphertext, password).toString(crypto.enc.Utf8);

    if (!decrypted.startsWith("CHECK")) {
      return null;
    } else {
      return decrypted.substring(5);
    }
  }
}
