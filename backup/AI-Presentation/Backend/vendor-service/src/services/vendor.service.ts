import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Vendor } from '../entities/vendor.entity'
import { VendorContactRequest } from '../entities/vendor-contact-request.entity'
import { RegisterVendorDto } from '../dtos/register-vendor.dto'

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(VendorContactRequest)
    private contactRequestRepository: Repository<VendorContactRequest>,
  ) {}

  async registerVendor(registerDto: RegisterVendorDto) {
    // Check if vendor already exists
    const existingVendor = await this.vendorRepository.findOne({
      where: { email: registerDto.email },
    })

    if (existingVendor) {
      throw new ConflictException('Vendor already registered')
    }

    const vendor = this.vendorRepository.create(registerDto)
    return this.vendorRepository.save(vendor)
  }

  async getAllVendors() {
    return this.vendorRepository.find({
      where: { isActive: true },
      order: { rating: 'DESC' },
    })
  }

  async getVendorsByCategory(category: string) {
    return this.vendorRepository.find({
      where: { category, isActive: true },
      order: { rating: 'DESC' },
    })
  }

  async getVendorById(id: string) {
    const vendor = await this.vendorRepository.findOne({ where: { id } })

    if (!vendor) {
      throw new NotFoundException('Vendor not found')
    }

    return vendor
  }

  async contactVendor(vendorId: string, userId: string, contactData: any) {
    const vendor = await this.getVendorById(vendorId)

    const contactRequest = this.contactRequestRepository.create({
      vendorId,
      userId,
      ...contactData,
    })

    // Emit notification event for vendor
    console.log(`New contact request for vendor ${vendor.name}`)

    return this.contactRequestRepository.save(contactRequest)
  }

  async getVendorContactRequests(vendorId: string) {
    return this.contactRequestRepository.find({
      where: { vendorId },
      relations: ['vendor'],
      order: { createdAt: 'DESC' },
    })
  }

  async updateRequestStatus(requestId: string, status: 'pending' | 'responded' | 'fulfilled') {
    const request = await this.contactRequestRepository.findOne({
      where: { id: requestId },
    })

    if (!request) {
      throw new NotFoundException('Request not found')
    }

    request.status = status
    return this.contactRequestRepository.save(request)
  }
}