import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { PrismaClient } from "@prisma/client";
import {
  IBuyerAddressRepository,
  BuyerAddressData,
  CreateBuyerAddressData,
  AddressesData,
} from "../../business/interfaces/buyer-address.interfaces";
import fs from "fs";
import path from "path";
@injectable()
export class BuyerAddressRepository implements IBuyerAddressRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) { }
  private postcodeData: AddressesData[] | null = null;
  private loadPostcodeData() {
    if (!this.postcodeData) {
      const filePath = path.resolve(
        __dirname,
        "../../data/database/address.json"
      );
      const raw = fs.readFileSync(filePath, "utf8");
      this.postcodeData = JSON.parse(raw);
    }
    return this.postcodeData;
  }

  private norm(s: any) {
    return (s ?? "")
      .toString()
      .normalize("NFC")
      .replace(/["'’“”]/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim()
      .toLowerCase();
  }

  private tokenize(raw: string): string[] {
    const q = this.norm(raw);
    if (!q) return [];
    // ดึงเลขไปรษณีย์ 5 หลัก
    const zips = Array.from(q.matchAll(/\d{5}/g)).map((m: any) => m[0]);
    // ดึงคำไทย/อังกฤษ (ตัดตัวเลขออกก่อนแล้ว split เป็นคำ)
    const words = Array.from(
      q.replace(/\d/g, " ").matchAll(/[\u0E00-\u0E7FA-Za-z]+/g)
    ).map((m: any) => m[0].toLowerCase());
    return [...zips, ...words];
  }

  async findBuyerAddressByBuyerId(
    buyerId: string
  ): Promise<BuyerAddressData[]> {
    const userAddresses = await this.prisma.userAddress.findMany({
      where: {
        userId: buyerId,
      },
      orderBy: { createdAt: "desc" },
    });

    return userAddresses.map((address: any) =>
      this.mapToBuyerAddressData(address)
    );
  }

  async findBuyerAddressById(id: string): Promise<BuyerAddressData | null> {
    const address = await this.prisma.userAddress.findFirst({
      where: {
        id,
      },
    });
    return address ? this.mapToBuyerAddressData(address) : null;
  }

  async createBuyerAddress(
    data: CreateBuyerAddressData
  ): Promise<BuyerAddressData> {
    if(data.isDefault && data.isDefault === true){
      await this.prisma.userAddress.updateMany({
        where: {
          userId: data.userId,
        },
        data: {
          isDefault: false,
        },
      });
    }
    const newAddress = await this.prisma.userAddress.create({
      data: {
        ...data,
      },
    });
    return this.mapToBuyerAddressData(newAddress);
  }

  async updateBuyerAddress(
    id: string,
    data: Partial<CreateBuyerAddressData>
  ): Promise<BuyerAddressData> {

  if(data.isDefault && data.isDefault === true){
    await this.prisma.userAddress.updateMany({
      where: {
        userId: data.userId,
      },
      data: {
        isDefault: false,
      },
    });
  }

    const updatedAddress = await this.prisma.userAddress.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return this.mapToBuyerAddressData(updatedAddress);
  }

  async deleteBuyerAddress(id: string): Promise<void> {
    await this.prisma.userAddress.delete({
      where: { id },
    });
  }

  private mapToBuyerAddressData(address: any): BuyerAddressData {
    return {
      id: address.id,
      userId: address.userId,
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      subDistrict: address.subDistrict,
      district: address.district,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country || "TH",
      isDefault: address.isDefault || false,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
      latitude: address.latitude,
      longitude: address.longitude,
    };
  }

  async findBuyerAddressBySearchText(
    searchText: string,
    page: number,
    limit: number
  ): Promise<AddressesData[]> {
    try {
      const postcodeData = this.loadPostcodeData();
      if (!postcodeData) throw new Error("Postcode data not found");

      const tokens = this.tokenize(searchText);
      if (tokens.length === 0) return [];

      const hasBadZip = tokens.some((t) => /^\d+$/.test(t) && t.length !== 5);
      if (hasBadZip) return [];

      const filtered = postcodeData.filter((item: AddressesData) => {
        const p = this.norm(item.province);
        const d = this.norm(item.district);
        const s = this.norm(item.subdistrict);
        const z = this.norm(item.zipcode);

        return tokens.every((t) => {
          if (/^\d{5}$/.test(t)) return z === t;
          return (
            p.includes(t) || d.includes(t) || s.includes(t) || z.includes(t)
          );
        });
      });

      const _limit = Math.min(Math.max(1, limit || 20), 100);
      const _page = Math.max(1, page || 1);
      const start = (_page - 1) * _limit;
      const pageItems = filtered.slice(start, start + _limit);

      return pageItems.map((it) => ({
        zipcode: it.zipcode || "",
        subdistrict: it.subdistrict || "",
        district: it.district || "",
        province: it.province || "",
      }));
    } catch (err) {
      console.error("findBuyerAddressBySearchText failed:", err);
      throw err;
    }
  }
}
