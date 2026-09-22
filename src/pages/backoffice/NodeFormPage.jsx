import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormSection from '../../components/common/FormSection';
import FormActions from '../../components/common/FormActions';
import { useNotification } from '../../context/NotificationContext';
import { getNodeById, createNode, updateNode } from '../../services/nodeService';

export default function NodeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    address: '',
    latitude: '6.9271',
    longitude: '79.8612',
    capacityKw: '300',
    storageCapacityKwh: '600',
    totalSlots: '6',
    status: 'Active',
  });

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isEdit) {
      const fetchNode = async () => {
        try {
          const data = await getNodeById(id);
          setFormData({
            id: data.id,
            name: data.name,
            address: data.address,
            latitude: String(data.latitude),
            longitude: String(data.longitude),
            capacityKw: String(data.capacityKw),
            storageCapacityKwh: String(data.storageCapacityKwh),
            totalSlots: String(data.totalSlots),
            status: data.status,
          });
        } catch {
          showError('Unable to load substation parameters.');
          navigate('/backoffice/nodes');
        } finally {
          setIsLoading(false);
        }
      };
      fetchNode();
    }
  }, [id, isEdit, navigate, showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.address.trim()) {
      setErrorMessage('Please fill in all required substation basic information.');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setErrorMessage('Latitude must be a valid coordinate between -90 and +90.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setErrorMessage('Longitude must be a valid coordinate between -180 and +180.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateNode(id, formData);
        showSuccess(`Microgrid Node ${formData.name} configuration updated.`);
      } else {
        await createNode(formData);
        showSuccess(`Microgrid Substation ${formData.name} commissioned successfully.`);
      }
      navigate('/backoffice/nodes');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save node configuration.');
      showError(err.message || 'API rejected node submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading substation data...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? `Configure Node: ${formData.name}` : 'Commission New Microgrid Node'}
        description="Configure technical capacity parameters, GPS telemetry, and storage bays for local substation."
        breadcrumbItems={[
          { label: 'Microgrid Nodes', path: '/backoffice/nodes' },
          { label: isEdit ? 'Edit Configuration' : 'Commission Node' },
        ]}
      />

      <div className="content-card">
        <div className="content-card__body">
          {errorMessage && (
            <div className="alert alert-danger py-2 small mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Section 1: Basic Substation Identification */}
            <FormSection
              title="1. Substation Identification"
              description="Basic facility naming and address information."
            >
              <div className="col-12 col-md-4">
                <label className="field-label" htmlFor="nodeId">
                  Substation Node Code <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  id="nodeId"
                  className="form-control font-monospace"
                  placeholder="e.g. ND-CENTRAL-01"
                  value={formData.id}
                  disabled={isEdit}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  required
                />
                <span className="field-helper">Unique immutable identifier in MongoDB.</span>
              </div>

              <div className="col-12 col-md-8">
                <label className="field-label" htmlFor="nodeName">
                  Substation Display Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  id="nodeName"
                  className="form-control"
                  placeholder="e.g. Central District Primary Substation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="col-12">
                <label className="field-label" htmlFor="nodeAddress">
                  Physical Facility Location / Address <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  id="nodeAddress"
                  className="form-control"
                  placeholder="Street, City, Sector"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
            </FormSection>

            {/* Section 2: GPS Telemetry */}
            <FormSection
              title="2. Geospatial Coordinates"
              description="Precise GPS coordinates for mapping and regional routing."
            >
              <div className="col-12 col-sm-6">
                <label className="field-label" htmlFor="latitude">
                  Latitude (Decimal Degrees) <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  id="latitude"
                  className="form-control font-monospace"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  required
                />
                <span className="field-helper">Format: -90.0000 to +90.0000</span>
              </div>

              <div className="col-12 col-sm-6">
                <label className="field-label" htmlFor="longitude">
                  Longitude (Decimal Degrees) <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  id="longitude"
                  className="form-control font-monospace"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  required
                />
                <span className="field-helper">Format: -180.0000 to +180.0000</span>
              </div>
            </FormSection>

            {/* Section 3: Capacity Specifications */}
            <FormSection
              title="3. Power & Storage Ratings"
              description="Rated transformer peak throughput and modular storage threshold."
            >
              <div className="col-12 col-sm-6">
                <label className="field-label" htmlFor="capacityKw">
                  Peak Power Output Rating <span className="required-star">*</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    id="capacityKw"
                    min="10"
                    step="5"
                    className="form-control"
                    value={formData.capacityKw}
                    onChange={(e) => setFormData({ ...formData, capacityKw: e.target.value })}
                    required
                  />
                  <span className="input-group-text">kW</span>
                </div>
                <span className="field-helper">Maximum instantaneous microgrid transfer capacity.</span>
              </div>

              <div className="col-12 col-sm-6">
                <label className="field-label" htmlFor="storageCapacityKwh">
                  Total Battery Storage Bank <span className="required-star">*</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    id="storageCapacityKwh"
                    min="20"
                    step="10"
                    className="form-control"
                    value={formData.storageCapacityKwh}
                    onChange={(e) => setFormData({ ...formData, storageCapacityKwh: e.target.value })}
                    required
                  />
                  <span className="input-group-text">kWh</span>
                </div>
                <span className="field-helper">Aggregated storage capacity of all module bays.</span>
              </div>
            </FormSection>

            {/* Section 4: Battery Storage Bays & Operational State */}
            <FormSection
              title="4. Modular Storage Bays & Operational State"
              description="Physical modular bay slot count and status flag."
            >
              <div className="col-12 col-sm-6">
                <label className="field-label" htmlFor="totalSlots">
                  Number of Battery Storage Bays <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  id="totalSlots"
                  min="1"
                  max="32"
                  className="form-control"
                  value={formData.totalSlots}
                  onChange={(e) => setFormData({ ...formData, totalSlots: e.target.value })}
                  required
                />
                <span className="field-helper">Number of individual addressable battery slots (1 - 32).</span>
              </div>

              <div className="col-12 col-sm-6">
                <label className="field-label" htmlFor="nodeStatus">
                  Initial Operational Status <span className="required-star">*</span>
                </label>
                <select
                  id="nodeStatus"
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="Active">Active (Accepting Energy Transfers)</option>
                  <option value="Inactive">Inactive (Decommissioned / Offline)</option>
                  <option value="Maintenance">Maintenance (Restricted Operations)</option>
                </select>
              </div>
            </FormSection>

            <FormActions
              onCancel={() => navigate('/backoffice/nodes')}
              submitLabel={isEdit ? 'Save Node Configuration' : 'Commission & Deploy Node'}
              isSubmitting={isSubmitting}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
